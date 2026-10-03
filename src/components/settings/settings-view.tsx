"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/catalog/field";
import { BackupBanner } from "@/components/settings/backup-banner";
import { DataManagement } from "@/components/settings/data-management";
import { LoadError, LoadingRows, PageHeader } from "@/components/catalog/page-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEntityList } from "@/hooks/use-entity-list";
import {
  companySchema,
  passwordSchema,
  preferencesSchema,
  type CompanyFormValues,
  type PasswordFormValues,
  type PreferencesFormValues,
} from "@/lib/schemas/settings";
import { dateFormats, type DateFormat } from "@/lib/settings-defaults";
import * as settingsService from "@/lib/services/settings.service";

const dateFormatLabels: Record<DateFormat, string> = {
  "dd MMM yyyy": "02 Oct 2026",
  "dd/MM/yyyy": "02/10/2026",
  "yyyy-MM-dd": "2026-10-02",
};

export function SettingsView() {
  const { data, error, loading, reload } = useEntityList(() => settingsService.getSettings());

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Settings" description="Company details, display preferences, the demo sign-in password, and data backups." />
      <BackupBanner />
      {loading ? <LoadingRows /> : null}
      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {data ? (
        <>
          <CompanyForm
            key={`${data.businessName}-${data.phone}`}
            defaults={data}
            onSaved={reload}
          />
          <PreferencesForm
            key={`${data.currencySymbol}-${data.dateFormat}-${data.defaultLowStockThreshold}`}
            defaults={data}
            onSaved={reload}
          />
          <PasswordForm />
          <DataManagement />
        </>
      ) : null}
    </div>
  );
}

function CompanyForm({
  defaults,
  onSaved,
}: {
  defaults: CompanyFormValues;
  onSaved: () => void;
}) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    mode: "onChange",
    defaultValues: defaults,
  });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: CompanyFormValues) {
    try {
      await settingsService.updateSettings(values);
      toast.success("Company details saved");
      onSaved();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save company details.");
    }
  }

  const errors = form.formState.errors;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Company</CardTitle>
        <CardDescription>Shown on invoices and in the header.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="business-name">Business name</Label>
            <Input id="business-name" {...form.register("businessName")} />
            <FieldError message={errors.businessName?.message} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="business-address">Address</Label>
            <Input id="business-address" {...form.register("address")} />
            <FieldError message={errors.address?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="business-phone">Phone</Label>
            <Input id="business-phone" {...form.register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="business-email">Email</Label>
            <Input id="business-email" type="email" {...form.register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="invoice-footer">Invoice footer</Label>
            <Input id="invoice-footer" {...form.register("invoiceFooter")} />
            <FieldError message={errors.invoiceFooter?.message} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save company"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesForm({
  defaults,
  onSaved,
}: {
  defaults: PreferencesFormValues;
  onSaved: () => void;
}) {
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    mode: "onChange",
    defaultValues: defaults,
  });
  const dateFormat = useWatch({ control: form.control, name: "dateFormat" });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: PreferencesFormValues) {
    try {
      await settingsService.updateSettings(values);
      toast.success("Preferences saved");
      onSaved();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save preferences.");
    }
  }

  const errors = form.formState.errors;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Used when a product has no own low-stock threshold, and for amounts and dates.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="low-stock">Default low-stock threshold</Label>
            <Input
              id="low-stock"
              type="number"
              min={0}
              {...form.register("defaultLowStockThreshold", { valueAsNumber: true })}
            />
            <FieldError message={errors.defaultLowStockThreshold?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="currency">Currency symbol</Label>
            <Input id="currency" {...form.register("currencySymbol")} />
            <FieldError message={errors.currencySymbol?.message} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Date format</Label>
            <Select
              value={dateFormat}
              onValueChange={(value) =>
                form.setValue("dateFormat", (value ?? "dd MMM yyyy") as DateFormat, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Date format" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((item) => (
                  <SelectItem key={item} value={item}>
                    {dateFormatLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.dateFormat?.message} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    defaultValues: { currentPassword: "", nextPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    void form.trigger();
  }, [form]);

  async function onSubmit(values: PasswordFormValues) {
    try {
      await settingsService.changePassword(values.currentPassword, values.nextPassword);
      toast.success("Password updated");
      form.reset();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not update the password.");
    }
  }

  const errors = form.formState.errors;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Changes the password accepted on the sign-in screen.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" autoComplete="current-password" {...form.register("currentPassword")} />
            <FieldError message={errors.currentPassword?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="next-password">New password</Label>
            <Input id="next-password" type="password" autoComplete="new-password" {...form.register("nextPassword")} />
            <FieldError message={errors.nextPassword?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
            <FieldError message={errors.confirmPassword?.message} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Change password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
