import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Truck,
  Factory,
  Route as RouteIcon,
  Map,
  Building2,
  Gauge,
  Lightbulb,
  Upload,
  ShieldCheck,
  Table2,
  Calculator,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/tabelas/auth";

const analise = [
  { titulo: "Dashboard", url: "/", icone: LayoutDashboard },
  { titulo: "CT-es", url: "/ctes", icone: FileText },
  { titulo: "Transportadoras", url: "/transportadoras", icone: Truck },
  { titulo: "Fornecedores", url: "/fornecedores", icone: Factory },
  { titulo: "Rotas", url: "/rotas", icone: RouteIcon },
  { titulo: "Regiões", url: "/regioes", icone: Map },
  { titulo: "Unidades", url: "/unidades", icone: Building2 },
] as const;

const inteligencia = [
  { titulo: "Benchmark", url: "/benchmark", icone: Gauge },
  { titulo: "Oportunidades", url: "/oportunidades", icone: Lightbulb },
] as const;

const cotacao = [
  { titulo: "Tabelas de Frete", url: "/tabelas", icone: Table2 },
  { titulo: "Cotar frete", url: "/tabelas/simulador", icone: Calculator },
] as const;

const base = [
  { titulo: "Importação", url: "/importacao", icone: Upload },
  { titulo: "Qualidade da Base", url: "/qualidade", icone: ShieldCheck },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { usuario, sair } = useAuth();

  const grupos = [
    { rotulo: "Análise", itens: analise },
    { rotulo: "Inteligência", itens: inteligencia },
    { rotulo: "Cotação de Fretes", itens: cotacao },
    { rotulo: "Base de dados", itens: base },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-background shadow-xs">
            <img src="/app-icon.png" alt="KPI Fretes Logo" className="size-full object-cover" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold leading-tight">KPI Fretes de Compras</p>
            <p className="truncate text-[11px] text-muted-foreground">Camaquã · Pelotas</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.rotulo}>
            <SidebarGroupLabel>{grupo.rotulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.titulo}
                      isActive={pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icone />
                        <span>{item.titulo}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: "oklch(0.72 0.13 195 / 0.2)", color: "oklch(0.72 0.13 195)" }}
          >
            {usuario?.nome?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">{usuario?.nome ?? "Usuário"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{usuario?.email ?? ""}</p>
          </div>
          <button
            onClick={sair}
            title="Sair"
            aria-label="Sair"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
