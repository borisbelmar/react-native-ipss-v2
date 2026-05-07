import { router } from "expo-router";
import { useState } from "react";

export function useLogin() {
  const [email, setEmail] = useState("pepe@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailChange = (text: string) => {
    setEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleLogin = () => {
    if (password !== "1234") {
      setError("Contraseña incorrecta");
      return;
    }

    setError("");
    router.push({
      pathname: "/(tabs)/notes",
    });
  };

  return {
    email,
    password,
    error,
    handleEmailChange,
    handlePasswordChange,
    handleLogin,
  };
}
