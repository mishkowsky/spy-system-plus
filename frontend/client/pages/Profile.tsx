import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";

// Zod schemas without translations (will be handled in components)
const profileFormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  surname: z.string().min(1),
  lastname: z.string().min(1),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Helper function to translate zod validation error messages
function getLocalizedProfileSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t("formErrors.invalidEmail")),
    name: z.string().min(1, t("formErrors.firstNameRequired")),
    surname: z.string().min(1, t("formErrors.lastNameRequired")),
    lastname: z.string().min(1, t("formErrors.middleNameRequired")),
  });
}

function getLocalizedPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, t("formErrors.currentPasswordRequired")),
      newPassword: z.string().min(6, t("formErrors.passwordTooShort")),
      confirmPassword: z.string().min(6, t("formErrors.confirmPassword")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("formErrors.passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleLeaveProfile = () => {
    if (!user) return;

    // Navigate to appropriate dashboard based on user role
    switch (user.role) {
      case "client":
        window.location.href = "/dashboard";
        break;
      case "manager":
        window.location.href = "/dashboard";
        break;
      case "SURVEILLANCE_OFFICER":
      case "CORRECTIONS_OFFICER":
        window.location.href = "/dashboard";
        break;
      default:
        window.location.href = "/dashboard";
        break;
    }
  };

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(getLocalizedProfileSchema(t)),
    defaultValues: {
      email: user?.email || "",
      name: user?.firstName || user?.name || "",
      surname: user?.lastName || user?.surname || "",
      lastname: user?.lastname || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(getLocalizedPasswordSchema(t)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfile = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsUpdatingProfile(true);
    setProfileSuccess(false);

    try {
      // Store original role to prevent issues with user object updates
      const userRole = user.role;
      const userId = user.id;

      // Determine the correct endpoint based on user role
      let endpoint = "";
      switch (userRole) {
        case "client":
          endpoint = `/clients/${userId}`;
          break;
        case "manager":
          endpoint = `/managers/${userId}`;
          break;
        case "SURVEILLANCE_OFFICER":
        case "CORRECTIONS_OFFICER":
          endpoint = `/workers/${userId}`;
          break;
        default:
          console.error("Unknown user role:", userRole);
          throw new Error(`Invalid user role: ${userRole}`);
      }

      // Update user profile via role-specific API endpoint
      const updatedUser = await apiClient.patch(endpoint, {
        email: values.email,
        name: values.name,
        surname: values.surname,
        lastname: values.lastname,
      });

      // Ensure the role is preserved in the updated user object
      const userWithPreservedRole = {
        ...updatedUser,
        role: userRole,
      };

      // Update auth context
      await updateUser(userWithPreservedRole);
      setProfileSuccess(true);
      apiClient.updateEmail(values.email);

      // Hide success message after 3 seconds
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error: any) {
      console.error("Failed to update profile:", error);

      if (error.response?.status === 409) {
        profileForm.setError("email", {
          type: "manual",
          message: t("profile.errors.emailExists"),
        });
      } else if (error.response?.data?.error) {
        profileForm.setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      } else {
        profileForm.setError("root", {
          type: "manual",
          message: error.message || t("profile.errors.updateFailed"),
        });
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updatePassword = async (values: PasswordFormValues) => {
    if (!user) return;

    setIsUpdatingPassword(true);
    setPasswordSuccess(false);

    try {
      // Determine the correct endpoint based on user role
      let endpoint = "";
      switch (user.role) {
        case "client":
          endpoint = `/clients/${user.id}/password`;
          break;
        case "manager":
          endpoint = `/managers/${user.id}/password`;
          break;
        case "SURVEILLANCE_OFFICER":
        case "CORRECTIONS_OFFICER":
          endpoint = `/workers/${user.id}/password`;
          break;
        default:
          throw new Error("Invalid user role");
      }

      await apiClient.patch(endpoint, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      const credentials_s = `${user.email}:${values.newPassword}`;
      const encodedCredentials = btoa(credentials_s); // base64 encode
      apiClient.setAuthToken(encodedCredentials);
      setPasswordSuccess(true);
      passwordForm.reset();

      // Hide success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error("Failed to update password:", error);

      if (error.response?.status === 403) {
        passwordForm.setError("currentPassword", {
          type: "manual",
          message: t("profile.errors.incorrectPassword"),
        });
      } else if (error.response?.status === 401) {
        passwordForm.setError("currentPassword", {
          type: "manual",
          message: t("profile.errors.incorrectPassword"),
        });
      } else if (error.response?.data?.error) {
        passwordForm.setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      } else {
        passwordForm.setError("root", {
          type: "manual",
          message: error.message || t("profile.errors.passwordUpdateFailed"),
        });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("profile.title")}
            </h1>
            <p className="text-gray-600 mt-2">{t("profile.description")}</p>
          </div>
          <Button
            onClick={handleLeaveProfile}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("profile.backToDashboard")}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("profile.profileInfo")}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t("profile.security")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Information Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.profileInfo")}</CardTitle>
                <CardDescription>
                  {t("profile.updateProfileInfo")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profileSuccess && (
                  <Alert className="mb-6">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("misc.profileUpdatedSuccessfully")}
                    </AlertDescription>
                  </Alert>
                )}

                {profileForm.formState.errors.root && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                      {profileForm.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(updateProfile)}
                    className="space-y-6"
                  >
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("misc.emailAddress")}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t("misc.enterYourEmail")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("misc.firstName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("misc.enterYourFirstName")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("misc.lastName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("misc.enterYourLastName")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("misc.middleName")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("misc.enterYourMiddleName")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          {t("button.updating")}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t("button.saveChanges")}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t("misc.changePassword")}</CardTitle>
                <CardDescription>
                  {t("misc.updatePasswordToKeepAccountSecure")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordSuccess && (
                  <Alert className="mb-6">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("misc.passwordUpdatedSuccessfully")}
                    </AlertDescription>
                  </Alert>
                )}

                {passwordForm.formState.errors.root && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                      {passwordForm.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(updatePassword)}
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("misc.currentPassword")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder={t("misc.enterYourCurrentPassword")}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("misc.newPassword")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                placeholder={t("misc.enterYourNewPassword")}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("misc.confirmNewPassword")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder={t("misc.confirmYourNewPassword")}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          {t("button.updating")}
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          {t("button.updatePassword")}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
