import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Client } from "@/types";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useTranslation } from "@/hooks/use-translation";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    surname: "",
    lastname: "",
    metricThreshold: 100,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError(t("register.passwordsMismatch"));
      return;
    }

    if (formData.password.length < 6) {
      setError(t("register.passwordTooShort"));
      return;
    }

    if (!formData.name || !formData.surname || !formData.email) {
      setError(t("register.fillAllFields"));
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...clientData } = formData;

      // Create client using OpenAPI endpoint
      const clientPayload = {
        ...clientData,
        violationsCount: 0, // Default value for new clients
      };

      const newClient = await apiClient.post<Client>("/clients", clientPayload);

      setSuccess(true);

      // Redirect to login after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Registration failed:", err);

      // Handle specific error cases
      if (err.response?.status === 409) {
        setError(t("register.accountExists"));
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(
          err instanceof Error ? err.message : t("register.registrationFailed"),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {t("register.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("register.description")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {t("register.accountCreatedSuccess")}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">{t("register.name")}*</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={isLoading || success}
                  placeholder={t("register.enterFirstName")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surname">{t("register.surname")}*</Label>
                  <Input
                    id="surname"
                    type="text"
                    value={formData.surname}
                    onChange={(e) =>
                      handleInputChange("surname", e.target.value)
                    }
                    required
                    disabled={isLoading || success}
                    placeholder={t("register.middleName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">{t("register.lastName")}</Label>
                  <Input
                    id="lastname"
                    type="text"
                    value={formData.lastname}
                    onChange={(e) =>
                      handleInputChange("lastname", e.target.value)
                    }
                    disabled={isLoading || success}
                    placeholder={t("register.familyName")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("register.email")}*</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  disabled={isLoading || success}
                  placeholder={t("register.enterEmail")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}*</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
                    disabled={isLoading || success}
                    placeholder={t("register.minimumChars")}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || success}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("register.confirmPassword")}*
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    required
                    disabled={isLoading || success}
                    placeholder={t("register.repeatPassword")}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || success}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {success
                  ? t("register.accountCreated")
                  : t("register.creatingAccount")}
              </Button>
              <div className="text-sm text-center text-gray-600">
                {t("auth.alreadyHaveAccount")}{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  {t("auth.signIn")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PublicLayout>
  );
}
