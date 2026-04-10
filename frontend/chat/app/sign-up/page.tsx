import { useSignUp } from "@clerk/nextjs/legacy";
import { useState } from "react";

export default function SignUp(){

    const {isLoaded, signUp, setActive} = useSignUp()
    const [emailAddress,setEmailAddress] = useState("")
    const [password,setPassword] = useState("")
    const [pendingVerification, setPendingVerification] = useState(false)
    const [code,setCode] = useState("")
    const [error,setError] = useState("")
    const [showPassword,setShowPassword] = useState("")
    

    return(
        <div></div>
    )


}