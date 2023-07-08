"use client"

import { useState, useEffect } from 'react'
import { ProductWithPrice } from '../../types';

import { AuthModal } from '@/components/AuthModal';
import { UploadModal } from '@/components/UploadModal';
import { SubscribeModal } from '@/components/SubscribeModal';

interface ModalProviderProps {
  products: ProductWithPrice[]
}

 export function ModalProvider({ products }: ModalProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true)
  },[]);

  if(!isMounted){
    return null;
  }


  return (
    <>
     <AuthModal />
     <UploadModal />
     <SubscribeModal products={products} />
    </>
  )
 }

 /* Esse truque evita erros causados por estarmos fazendo renderização pelo lado do servidor, e isso faz que nunca queiramos renderizar um modelo se estivermos no lado do servidor "Server Side Render" */