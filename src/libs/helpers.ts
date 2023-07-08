import { Price } from "../../types";

export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Defina isso como a URL do seu site no ambiente de produção.
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Configurado automaticamente pelo Vercel.
    "http://localhost:3000/";
  
  // Certifique-se de incluir https:// quando não estiver usando o localhost.
  url.includes("http") ? url : `https://${url}`;
  // Certifique-se de incluir a barra / no final.
  url.charAt(url.length - 1) === "/" ? url : `${url}/`;

  return url;
};

export const postData = async ({ url, data }: { url: string; data?: { price: Price } }) => {
  console.log("POST REQUEST", url, data)

  const res: Response = await fetch(url, {
    method: 'POST',
    headers: new Headers({ 'content-type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data)
  })

  if(!res.ok) {
    console.log("Error in postData", { url, data, res });
    throw new Error(res.statusText)
  }

  return res.json();
 };

export const toDateTime = (secs: number) => {
  var t = new Date("1970-01-01T00:30:00Z")
  t.setSeconds(secs);
  return t;
}

