import { expect, test } from "@playwright/test";

test("login shell exposes accessible fields and protected navigation", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar no ERP iJúnior" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("manager uses the real session and reaches a real PostgreSQL contract", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("manager.e2e@example.com");
  await page.getByLabel("Senha").fill("manager-e2e-password");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Gerente Financeiro", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Carteira de contratos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contrato de demonstração" })).toBeVisible();
});
