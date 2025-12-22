import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/reset-password", {
        email,
      });

      if (response) {
        setSuccess(true);
        setEmail("");
        // setTimeout(() => {
        //   onOpenChange(false);
        //   setSuccess(false);
        // }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("modal.recoveryFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen === false) {
      setEmail("");
      setError("");
      setSuccess(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {success ? (
          <div></div>
        ) : (
          <DialogHeader>
            <DialogTitle>{t("modal.forgotPassword")}</DialogTitle>

            <DialogDescription>
              {t("modal.enterEmailForRecovery")}
            </DialogDescription>
          </DialogHeader>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <div className="text-center space-y-2">
              <p className="font-semibold text-foreground">
                {t("modal.recoveryEmailSent")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("modal.checkEmailForRecovery")}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="recovery-email">
                {t("profile.emailAddress")}
              </Label>
              <Input
                id="recovery-email"
                type="email"
                placeholder={t("register.enterEmail")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("modal.sendRecoveryEmail")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
