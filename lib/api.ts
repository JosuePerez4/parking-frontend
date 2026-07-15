const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Auth ───────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: "platform_admin" | "business_admin" | "operator";
  tenantId: number | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Credenciales inválidas");
  }
  return res.json();
}

// ── Tenants (negocios) ───────────────────────────────────────────────────────
export interface Tenant {
  id: number;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "active" | "inactive";
  createdAt: string;
}

export interface CreateTenantDto {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: "active" | "inactive";
}

export type UpdateTenantDto = Partial<CreateTenantDto>;

export async function listTenants(): Promise<Tenant[]> {
  const res = await fetch(`${API_BASE}/tenants`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar negocios");
  return res.json();
}

export async function getTenant(id: number): Promise<Tenant> {
  const res = await fetch(`${API_BASE}/tenants/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar el negocio");
  return res.json();
}

export async function createTenant(data: CreateTenantDto): Promise<Tenant> {
  const res = await fetch(`${API_BASE}/tenants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear el negocio");
  }
  return res.json();
}

export async function updateTenant(id: number, data: UpdateTenantDto): Promise<Tenant> {
  const res = await fetch(`${API_BASE}/tenants/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al actualizar el negocio");
  }
  return res.json();
}

export async function deactivateTenant(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tenants/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al desactivar el negocio");
  }
}

// ── Users (usuarios de plataforma / negocio) ────────────────────────────────
export interface AppUser {
  id: number;
  tenantId: number | null;
  email: string;
  fullName: string;
  role: "platform_admin" | "business_admin" | "operator";
  status: "active" | "inactive";
  createdAt: string;
}

export interface CreateUserDto {
  tenantId?: number;
  email: string;
  password: string;
  fullName: string;
  role: "platform_admin" | "business_admin" | "operator";
  status?: "active" | "inactive";
}

export interface UpdateUserDto {
  fullName?: string;
  role?: "platform_admin" | "business_admin" | "operator";
  status?: "active" | "inactive";
}

export async function listUsers(tenantId?: number): Promise<AppUser[]> {
  const qs = tenantId !== undefined ? `?tenantId=${tenantId}` : "";
  const res = await fetch(`${API_BASE}/users${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar usuarios");
  return res.json();
}

export async function createUser(data: CreateUserDto): Promise<AppUser> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear usuario");
  }
  return res.json();
}

export async function updateUser(id: number, data: UpdateUserDto): Promise<AppUser> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al actualizar usuario");
  }
  return res.json();
}

export async function deactivateUser(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al desactivar usuario");
  }
}

// ── Settings (tarifas, por negocio) ─────────────────────────────────────────
export interface AppSettings {
  id: number;
  tenantId: number;
  fraccionCarro: number;
  horaCarro: number;
  medioDiaCarro: number;
  diaCarro: number;
  mensualidadCarro: number;
  fraccionMoto: number;
  horaMoto: number;
  medioDiaMoto: number;
  diaMoto: number;
  mensualidadMoto: number;
}

export async function getSettings(tenantId: number): Promise<AppSettings | null> {
  const res = await fetch(`${API_BASE}/settings?tenantId=${tenantId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar configuración");
  const data = await res.json();
  return data ?? null;
}

export async function updateSettings(
  tenantId: number,
  data: Partial<AppSettings>,
): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings?tenantId=${tenantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al guardar configuración");
  return res.json();
}

// ── Clients ────────────────────────────────────────────────────────────────
export interface Client {
  id: number;
  tenantId: number;
  fullName: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  status: "active" | "inactive" | "blocked";
  createdAt: string;
}

export interface CreateClientDto {
  tenantId: number;
  fullName: string;
  document: string;
  phone: string;
  email: string;
  address: string;
}

export async function getClients(tenantId: number): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/clients?tenantId=${tenantId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar clientes");
  return res.json();
}

export interface UpdateClientDto {
  fullName?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: "active" | "inactive" | "blocked";
}

export async function updateClient(
  id: number,
  data: UpdateClientDto,
  tenantId: number,
): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}?tenantId=${tenantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al actualizar cliente");
  }
  return res.json();
}

export async function createClient(data: CreateClientDto): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear cliente");
  }
  return res.json();
}

export async function deleteClient(id: number, tenantId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${id}?tenantId=${tenantId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al eliminar cliente");
  }
}

// ── Vehicles ───────────────────────────────────────────────────────────────
export interface Vehicle {
  id: number;
  tenantId: number;
  clientId: number;
  plate: string;
  type: "car" | "moto" | "truck";
  brand: string;
  color: string;
  status: "active" | "inactive";
  createdAt: string;
  client?: {
    id: number;
    fullName: string;
    document: string;
    phone: string;
  };
  membership?: {
    id: number;
    status: "active" | "expired" | "cancelled";
    endDate: string;
  };
}

export interface CreateVehicleDto {
  tenantId: number;
  clientId: number;
  plate: string;
  type: "car" | "moto" | "truck";
  brand?: string;
  color?: string;
}

export async function getVehicles(tenantId: number): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles?tenantId=${tenantId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar vehículos");
  return res.json();
}

export async function createVehicle(data: CreateVehicleDto): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear vehículo");
  }
  return res.json();
}

export async function assignVehicleClient(
  vehicleId: number,
  clientId: number,
  tenantId: number,
): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}?tenantId=${tenantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  });
  if (!res.ok) throw new Error("Error al asignar cliente");
  return res.json();
}

export async function updateVehicle(
  id: number,
  data: { clientId?: number; brand?: string; color?: string },
  tenantId: number,
): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}?tenantId=${tenantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al actualizar vehículo");
  }
  return res.json();
}

export async function deleteVehicle(id: number, tenantId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${id}?tenantId=${tenantId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al eliminar vehículo");
  }
}

// ── Parking ────────────────────────────────────────────────────────────────
export interface ActiveVehicle {
  id: number;
  plate: string;
  vehicleType: string;
  entryTime: string;
  currentMinutes: number;
  duration: string;
  estimatedCost: number;
}

export async function getActiveVehicles(tenantId: number): Promise<ActiveVehicle[]> {
  const res = await fetch(`${API_BASE}/parking/active?tenantId=${tenantId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar parking activo");
  return res.json();
}

export async function exitVehicle(
  tenantId: number,
  plate: string,
): Promise<{
  plate: string;
  duration: string;
  totalMinutes: number;
  amountToPay: number;
}> {
  const res = await fetch(`${API_BASE}/parking/exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, plate }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al registrar salida");
  }
  return res.json();
}

// ── Entries (historial de ingresos/salidas) ─────────────────────────────────
export interface Entry {
  id: number;
  plate: string;
  entryTime: string;
  exitTime: string | null;
  amountPaid: number | null;
  vehicleType: string | null;
}

export async function getEntries(tenantId: number): Promise<Entry[]> {
  const res = await fetch(`${API_BASE}/parking/entries?tenantId=${tenantId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar historial");
  return res.json();
}

// ── Memberships ────────────────────────────────────────────────────────────
export interface Membership {
  id: number;
  tenantId: number;
  vehicleId: number;
  clientId: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  price: string;
  autoRenew: boolean;
  company: string | null;
  createdAt: string;
  paidAt: string | null;
  vehicle?: {
    id: number;
    plate: string;
    type: "car" | "moto" | "truck";
    brand: string;
    color: string;
  };
  client?: {
    id: number;
    fullName: string;
    document: string;
    phone: string;
    email: string;
  };
}

export interface CreateMembershipDto {
  tenantId: number;
  vehicleId: number;
  clientId: number;
  startDate: string;
  endDate: string;
  price: number;
  autoRenew?: boolean;
  company?: string;
}

export async function getMemberships(tenantId: number): Promise<Membership[]> {
  const res = await fetch(`${API_BASE}/memberships?tenantId=${tenantId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar mensualidades");
  return res.json();
}

export async function createMembership(data: CreateMembershipDto): Promise<Membership> {
  const res = await fetch(`${API_BASE}/memberships`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear mensualidad");
  }
  return res.json();
}

export async function getExpiringMemberships(tenantId: number): Promise<Membership[]> {
  const res = await fetch(`${API_BASE}/memberships/expiring?tenantId=${tenantId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar mensualidades por vencer");
  return res.json();
}

export async function renewMembership(id: number, tenantId: number): Promise<Membership> {
  const res = await fetch(`${API_BASE}/memberships/${id}/renew?tenantId=${tenantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Error al renovar mensualidad");
  return res.json();
}

export async function deleteMembership(id: number, tenantId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/memberships/${id}?tenantId=${tenantId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al eliminar mensualidad");
  }
}

// ── Reports / Caja ─────────────────────────────────────────────────────────
export interface CajaCobroRow {
  placa: string;
  tipo: string;
  esMensualidad: boolean;
  horaEntrada: string;
  horaSalida: string;
  duracion: string;
  monto: number;
}

export interface CajaReport {
  fecha: string;
  totalCOP: number;
  totalVehiculos: number;
  visitantes: number;
  mensualidades: number;
  ingresosMensualidades: number;
  desglosePorHora: { hora: string; cantidad: number }[];
  cobros: CajaCobroRow[];
}

export async function getCajaReport(fecha: string, tenantId: number): Promise<CajaReport> {
  const res = await fetch(`${API_BASE}/reports/caja?fecha=${fecha}&tenantId=${tenantId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al generar cierre de caja");
  }
  return res.json();
}
