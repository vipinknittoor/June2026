"use client";

import { Mail, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEmployees, useManagers, useCreateEmployee } from "@/hooks/useTasks";
import { employeeSchema, type EmployeeFormValues } from "@/schemas/employee.schema";

export default function EmployeesPage() {
  const employeesQuery = useEmployees();
  const managersQuery = useManagers();
  const createEmployee = useCreateEmployee();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const employees = employeesQuery.data ?? [];
  const managers = managersQuery.data ?? [];
  const isLoading = employeesQuery.isLoading || managersQuery.isLoading;
  const isError = employeesQuery.isError || managersQuery.isError;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: "EMPLOYEE",
    },
  });

  async function onSubmit(values: EmployeeFormValues) {
    setError("");
    try {
      await createEmployee.mutateAsync(values);
      reset();
      setOpen(false);
    } catch {
      setError("Failed to add team member. Email might already exist.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Team</h2>
          <p className="text-sm text-slate-600">Manage and assign roles to dashboard users.</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary-hover focus-visible:ring-primary"
          icon={<PlusCircle className="h-4 w-4" />}
          onClick={() => {
            setError("");
            reset();
            setOpen(true);
          }}
          type="button"
        >
          Add Team Member
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : isError ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Team members could not be loaded.</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Admins & Managers</h3>
            {managers.length === 0 ? (
              <p className="text-sm text-slate-500">No admins or managers registered.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {managers.map((manager) => (
                  <Card key={manager.id}>
                    <h4 className="font-semibold text-slate-950">{manager.name}</h4>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4" />
                      {manager.email}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Employees</h3>
            {employees.length === 0 ? (
              <p className="text-sm text-slate-500">No employees registered.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {employees.map((employee) => (
                  <Card key={employee.id}>
                    <h4 className="font-semibold text-slate-950">{employee.name}</h4>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4" />
                      {employee.email}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal onClose={() => setOpen(false)} open={open} title="Add Team Member">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            error={errors.name?.message}
            label="Name"
            type="text"
            {...register("name")}
          />
          <Input
            error={errors.email?.message}
            label="Email"
            type="email"
            {...register("email")}
          />
          <Input
            error={errors.password?.message}
            label="Password"
            type="password"
            {...register("password")}
          />
          <Select
            error={errors.role?.message}
            label="Role"
            {...register("role")}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin / Manager</option>
          </Select>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <Button isLoading={createEmployee.isPending} type="submit">
            Add Team Member
          </Button>
        </form>
      </Modal>
    </div>
  );
}
