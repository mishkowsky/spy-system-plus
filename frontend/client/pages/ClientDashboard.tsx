import React, { useState, useEffect } from "react";
import {
  Contract,
  CreateContractRequest,
  ContractStatus,
  UpdateContractStatusRequest,
} from "@/types";
import { apiClient } from "@/lib/api";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Calendar, DollarSign, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { contractStatusToClientRu, contractStatusToRu } from "@/translations/ru.ts";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [canCreateNewContract, setCanCreateNewContract] = useState(
    user.canCreateNewContract,
  );
  const [newContract, setNewContract] = useState<CreateContractRequest>({
    clientId: user?.id || "",
    clientDetails: "",
    filepath: "",
    startDate: "",
    endDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContractForEdit, setSelectedContractForEdit] =
    useState<Contract | null>(null);
  const [editedContract, setEditedContract] = useState({
    clientDetails: "",
    startDate: "",
    endDate: "",
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      // Use OpenAPI compliant endpoint with filtering by clientId
      const contracts = await apiClient.get<Contract[]>(
        `/contracts/filtered?clientId=${user?.id}`,
      );
      console.log(user);
      setContracts(contracts);
    } catch (error) {
      setError(t("formErrors.failedToFetchContracts"));
      console.error("Failed to fetch contracts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const result = await apiClient.uploadFile<{
        success: boolean;
        path: string;
        filename: string;
        uploaderId: string;
      }>("/files/upload", file);

      return result.path;
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error(t("formErrors.failedToUploadFile"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!user?.id) return;
    if (!selectedFile) {
      setError(t("formErrors.pleaseSelectFile"));
      return;
    }
    if (!newContract.clientDetails.trim()) {
      setError(t("formErrors.pleaseProvideContractDetails"));
      return;
    }
    if (!newContract.startDate) {
      setError(t("formErrors.pleaseProvideStartDate"));
      return;
    }
    if (
      newContract.endDate &&
      new Date(newContract.startDate) >= new Date(newContract.endDate)
    ) {
      setError(t("formErrors.endDateAfterStart"));
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      // Upload file first
      const filepath = await uploadFile(selectedFile);

      // Create contract following OpenAPI schema
      const contractData = {
        status: "CREATED",
        filepath: filepath,
        clientId: parseInt(user?.id || "1"),
        signerId: 2, // Manager ID
        clientDetails: newContract.clientDetails,
        startDate: newContract.startDate,
        endDate: newContract.endDate,
      };

      const createdContract = await apiClient.post<Contract>(
        "/contracts",
        contractData,
      );
      setContracts((prev) => [...prev, createdContract]);
      setIsCreateModalOpen(false);
      setNewContract({
        clientId: user?.id || "",
        clientDetails: "",
        filepath: "",
        startDate: "",
        endDate: "",
      });
      setSelectedFile(null);
      setCanCreateNewContract(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("formErrors.failedToCreateContract"),
      );
      console.error("Failed to create contract:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const signContract = async (contractId: number) => {
    try {
      const updateRequest: UpdateContractStatusRequest = {
        status: ContractStatus.SIGNED,
      };
      await apiClient.patch<Contract>(
        `/contracts/${contractId}`,
        updateRequest,
      );
      // Refresh contracts after signing
      fetchContracts();
    } catch (error) {
      console.error("Failed to sign contract:", error);
      setError(t("formErrors.failedToSignContract"));
    }
  };

  const openEditModal = (contract: Contract) => {
    setSelectedContractForEdit(contract);
    setEditedContract({
      clientDetails: contract.clientDetails || "",
      startDate: contract.startDate || "",
      endDate: contract.endDate || "",
    });
    setEditFile(null);
    setIsEditModalOpen(true);
    setError("");
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedContractForEdit(null);
    setEditedContract({
      clientDetails: "",
      startDate: "",
      endDate: "",
    });
    setEditFile(null);
    setError("");
  };

  const handleEditContractSubmit = async () => {
    if (!selectedContractForEdit) return;

    if (!editedContract.clientDetails.trim()) {
      setError(t("formErrors.pleaseProvideContractDetails"));
      return;
    }
    if (!editedContract.startDate) {
      setError(t("formErrors.pleaseProvideStartDate"));
      return;
    }
    if (
      editedContract.endDate &&
      new Date(editedContract.startDate) >= new Date(editedContract.endDate)
    ) {
      setError(t("formErrors.endDateAfterStart"));
      return;
    }

    setIsEditSubmitting(true);
    setError("");

    try {
      let filepath = selectedContractForEdit.filepath;

      // Upload new file if selected
      if (editFile) {
        setIsUploading(true);
        filepath = await uploadFile(editFile);
        setIsUploading(false);
      }

      // Update contract
      const updateData = {
        clientDetails: editedContract.clientDetails,
        startDate: editedContract.startDate,
        endDate: editedContract.endDate,
        filepath: filepath,
      };

      const updatedContract = await apiClient.patch<Contract>(
        `/contracts/${selectedContractForEdit.id}`,
        updateData,
      );

      // Update contracts list
      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContractForEdit.id ? updatedContract : c,
        ),
      );

      closeEditModal();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("formErrors.failedToEditContract"),
      );
      console.error("Failed to update contract:", error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const getContractStatusBadgeVariant = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.SIGNED:
        return "default";
      case ContractStatus.SEND_TO_CLIENT:
      case ContractStatus.CREATED:
        return "outline";
      case ContractStatus.OUTDATED:
      default:
        return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getContractStats = () => {
    const total = contracts.length;
    const signed = contracts.filter(
      (c) => c.status === ContractStatus.SIGNED,
    ).length;
    const pending = contracts.filter(
      (c) => c.status === ContractStatus.SEND_TO_CLIENT,
    ).length;
    // const totalValue = contracts
    //   .filter((c) => c.status === ContractStatus.SIGNED)
    //   .reduce((sum, c) => sum + c.amount, 0);

    return { total, signed, pending };
  };

  const stats = getContractStats();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Contracts Table */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Договоры</CardTitle>
                <CardDescription>
                  Список всех ваших договоров и их текущий статус.
                </CardDescription>
              </div>
              <DialogTrigger asChild>
                {canCreateNewContract ? (
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать договор
                  </Button>
                ) : (
                  ""
                )}
              </DialogTrigger>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : contracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Договоры не найдены. Создайте свой первый договор.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Договор</TableHead>
                      <TableHead>Дата начала</TableHead>
                      <TableHead>Дата окончания</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Подписывающий</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">
                              Договор #{contract.id}
                            </div>
                            {/*{contract.clientDetails && (*/}
                            {/*  <div className="text-sm text-muted-foreground">*/}
                            {/*    {contract.clientDetails}*/}
                            {/*  </div>*/}
                            {/*)}*/}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contract.startDate
                            ? formatDate(contract.startDate)
                            : "Not specified"}
                        </TableCell>
                        <TableCell>
                          {contract.endDate ? (
                            formatDate(contract.endDate)
                          ) : (
                            <span className="text-muted-foreground">
                              Бессрочный
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getContractStatusBadgeVariant(contract.status)}
                          >
                            {contractStatusToClientRu(contract.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contract.signer
                            ? `${contract.signer.name} ${contract.signer.surname} ${contract.signer.lastname}`
                            : `Signer ID: ${contract.signerId}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {contract.status === ContractStatus.CREATED && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(contract)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {t("button.edit")}
                              </Button>
                            )}
                            {contract.status ===
                              ContractStatus.SEND_TO_CLIENT && (
                              <Button
                                size="sm"
                                onClick={() => signContract(contract.id)}
                              >
                                {t("button.signContract")}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog Content for creating contracts */}
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {t("contractManagement.createNewContract")}
              </DialogTitle>
              <DialogDescription>
                {t("contractManagement.fillDetailsToCreate")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="clientDetails">
                  {t("form.contractDetails")}
                </Label>
                <Textarea
                  id="clientDetails"
                  value={newContract.clientDetails}
                  onChange={(e) =>
                    setNewContract({
                      ...newContract,
                      clientDetails: e.target.value,
                    })
                  }
                  placeholder={t("contract.enterContractDetails")}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("contract.startDate")}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newContract.startDate}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("contract.endDate")}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newContract.endDate}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">{t("contract.contractFile")}</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {t("form.fileSelected", { name: selectedFile.name })}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateContract}
                disabled={isCreating || isUploading}
              >
                {isUploading
                  ? t("contract.uploadingFile")
                  : isCreating
                    ? t("contract.creatingContract")
                    : t("contract.createNewContract")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Contract Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {t("contractManagement.editContractId", {
                  id: selectedContractForEdit?.id.toString() || "",
                })}
              </DialogTitle>
              <DialogDescription>
                {t("contractManagement.updateDetails")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="editClientDetails">
                  {t("contract.contractDetails")}
                </Label>
                <Textarea
                  id="editClientDetails"
                  value={editedContract.clientDetails}
                  onChange={(e) =>
                    setEditedContract({
                      ...editedContract,
                      clientDetails: e.target.value,
                    })
                  }
                  placeholder={t("contract.enterContractDetails")}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">
                    {t("contract.startDate")}
                  </Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={editedContract.startDate}
                    onChange={(e) =>
                      setEditedContract({
                        ...editedContract,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">{t("contract.endDate")}</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={editedContract.endDate}
                    onChange={(e) =>
                      setEditedContract({
                        ...editedContract,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editFile">{t("contract.contractFile")}</Label>
                <Input
                  id="editFile"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditFile(file);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.txt"
                />
                {editFile && (
                  <p className="text-sm text-muted-foreground">
                    {t("form.newFileSelected", { name: editFile.name })}
                  </p>
                )}
                {!editFile && selectedContractForEdit?.filename && (
                  <p className="text-sm text-muted-foreground">
                    {t("form.currentFile", {
                      filepath: selectedContractForEdit.filename,
                    })}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeEditModal}
                disabled={isEditSubmitting || isUploading}
              >
                {t("button.cancel")}
              </Button>
              <Button
                type="submit"
                onClick={handleEditContractSubmit}
                disabled={isEditSubmitting || isUploading}
              >
                {isUploading
                  ? t("button.updating")
                  : isEditSubmitting
                    ? t("button.updating")
                    : t("contract.updateContract")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
