import React, { useState } from "react";
import { Device } from "@/types";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Monitor } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/hooks/use-translation";

interface RegisterDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceCreated: (device: Device) => void;
}

export function RegisterDeviceModal({
  open,
  onOpenChange,
  onDeviceCreated,
}: RegisterDeviceModalProps) {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);

  const registerDeviceSchema = z.object({
    deviceId: z.string().min(1, t("validation.idRequired")),
  });

  type RegisterDeviceFormValues = z.infer<typeof registerDeviceSchema>;

  const form = useForm<RegisterDeviceFormValues>({
    resolver: zodResolver(registerDeviceSchema),
    defaultValues: {
      deviceId: "",
    },
  });

  const onSubmit = async (values: RegisterDeviceFormValues) => {
    setIsCreating(true);

    try {
      const newDevice = await apiClient.post<Device>("/devices", {
        deviceId: values.deviceId,
        assignedToClientId: null,
        batteryLevel: 100,
      });

      onDeviceCreated(newDevice);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to register device:", error);

      if (error.response?.status === 409) {
        form.setError("deviceId", {
          type: "manual",
          message: t("device.already_exists"),
        });
      } else if (error.response?.status === 400) {
        form.setError("deviceId", {
          type: "manual",
          message: error.response.data?.error || t("device.invalid_id"),
        });
      } else if (error.response?.data?.error) {
        form.setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      } else {
        form.setError("root", {
          type: "manual",
          message: error.message || t("device.failedToRegister"),
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t("device.registerNewDevice")}
          </DialogTitle>
          <DialogDescription>{t("device.registrationTitle")}</DialogDescription>
        </DialogHeader>

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("device.deviceId")} *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("device.enterDeviceId")}
                      {...field}
                      min="1"
                      step="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                {t("button.cancel")}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    {t("device.registeringDevice")}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("device.registerNewDevice")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
