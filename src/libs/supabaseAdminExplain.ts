import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { Database } from "../../types.db";
import { Price, Product } from "../../types";

import { stripe } from "./stripe";
import { toDateTime } from "./helpers";

// Cria uma instância do cliente Supabase utilizando as variáveis de ambiente
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Função assíncrona para inserir ou atualizar um registro de produto no banco de dados
const upsertProductRecord = async (product: Stripe.Product) => {
  // Mapeia os dados do produto recebido para um formato compatível com o banco de dados
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  // Insere ou atualiza o registro do produto no banco de dados Supabase
  const { error } = await supabaseAdmin.from("products").upsert([productData]);
  if (error) throw error;
  console.log(`Product inserted/updated: ${product.id}`);
};

// Função assíncrona para inserir ou atualizar um registro de preço no banco de dados
const upsertPriceRecord = async (price: Stripe.Price) => {
  // Mapeia os dados do preço recebido para um formato compatível com o banco de dados
  const priceData: Price = {
    id: price.id,
    product_id: typeof price.product === "string" ? price.product : "",
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? undefined,
    type: price.type,
    unit_amount: price.unit_amount ?? undefined,
    interval: price.recurring?.interval,
    interval_count: price.recurring?.interval_count,
    trial_period_days: price.recurring?.trial_period_days,
    metadata: price.metadata,
  };

  // Insere ou atualiza o registro do preço no banco de dados Supabase
  const { error } = await supabaseAdmin.from("prices").upsert([priceData]);
  if (error) throw error;
  console.log(`Price inserted/updated: ${price.id}`);
};

// Função assíncrona para criar ou recuperar um cliente no Stripe
const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  // Verifica se o cliente já existe no banco de dados
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", uuid)
    .single();

  // Se ocorrer um erro ou o cliente não existir, cria um novo cliente no Stripe e insere no banco de dados
  if (error || !data?.stripe_customer_id) {
    const customerData: { metadata: { supabaseUUID: string }; email?: string } =
      {
        metadata: {
          supabaseUUID: uuid,
        },
      };
    if (email) customerData.email = email;

    // Cria o cliente no Stripe
    const customer = await stripe.customers.create(customerData);

    // Insere o novo cliente no banco de dados
    const { error: supabaseError } = await supabaseAdmin
      .from("customers")
      .insert([{ id: uuid, stripe_customer_id: customer.id }]);
    if (supabaseError) throw supabaseError;

    console.log(`New customer created and inserted for ${uuid}.`);
    return customer.id;
  }

  // Retorna o ID do cliente existente no Stripe
  return data.stripe_customer_id;
};

// Função assíncrona para copiar os detalhes de faturamento do objeto de pagamento para o cliente
const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  // Obtém o ID do cliente a partir do objeto de pagamento
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;

  // Verifica se todos os detalhes de faturamento estão presentes
  if (!name || !phone || !address) return;

  // Atualiza os detalhes de faturamento do cliente no Stripe
  //@ts-ignore
  await stripe.customers.update(customer, { name, phone, address });

  // Atualiza os detalhes de faturamento e o método de pagamento no banco de dados
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      billing_address: { ...address },
      payment_method: { ...payment_method[payment_method.type] },
    })
    .eq("id", uuid);

  if (error) throw error;
};

// Função assíncrona para lidar com a alteração de status de uma assinatura
const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  // Obtém o UUID do cliente a partir do banco de dados
  const { data: customerData, error: noCustomerError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  if (noCustomerError) throw noCustomerError;

  const { id: uuid } = customerData!;

  // Obtém os detalhes da assinatura do Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  });

  // Mapeia os dados da assinatura para um formato compatível com o banco de dados
  //@ts-ignore
  const subscriptionData: Database["public"]["Tables"]["subscriptions"]["Insert"] =
    {
      id: subscription.id,
      user_id: uuid,
      metadata: subscription.metadata,
      //@ts-ignore
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      //@ts-ignore
      quantity: subscription.quantity,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at
        ? toDateTime(subscription.cancel_at).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? toDateTime(subscription.canceled_at).toISOString()
        : null,
      current_period_start: toDateTime(
        subscription.current_period_start
      ).toISOString(),
      current_period_end: toDateTime(
        subscription.current_period_end
      ).toISOString(),
      created: toDateTime(subscription.created).toISOString(),
      ended_at: subscription.ended_at
        ? toDateTime(subscription.ended_at).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? toDateTime(subscription.trial_start).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? toDateTime(subscription.trial_end).toISOString()
        : null,
    };

  // Insere ou atualiza o registro da assinatura no banco de dados Supabase
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert([subscriptionData]);
  if (error) throw error;
  console.log(
    `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`
  );

  // Se for uma nova assinatura, copia os detalhes de faturamento para o objeto do cliente
  if (createAction && subscription.default_payment_method && uuid)
    await copyBillingDetailsToCustomer(
      uuid,
      subscription.default_payment_method as Stripe.PaymentMethod
    );
};

// Exporta as funções para uso em outros arquivos
export {
  upsertProductRecord,
  upsertPriceRecord,
  createOrRetrieveCustomer,
  manageSubscriptionStatusChange,
};
