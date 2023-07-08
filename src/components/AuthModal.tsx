"use client"

import { useSupabaseClient, useSessionContext} from "@supabase/auth-helpers-react"
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react"

import { useAuthModal } from "@/hooks/useAuthModal";
import { Modal } from "./Modal"

export function AuthModal() {
  const supabaseClient = useSupabaseClient();
  const { session } = useSessionContext();
  const router = useRouter();
  const { onClose, isOpen} = useAuthModal();

  useEffect(() => {
    if(session){
      router.refresh();
      onClose();
    }
  },[session, router, onClose])

  const onChange = (open: boolean) => {
    if(!open){
      onClose();
    }
  }

  return (
   <Modal 
   title="Welcome back" 
   description="Login to your account" 
   isOpen={isOpen}
   onChange={onChange}
   >
    <Auth  
    supabaseClient={supabaseClient} 
    theme="dark"
    magicLink
    providers={["github"]}
    appearance={{ 
      theme: ThemeSupa,
      variables: {
        default: {
          colors: {
            brand: "#404040",
            brandAccent: "#22c55e"
          }
        }
      }
    }}
    />
   </Modal>
  )
}