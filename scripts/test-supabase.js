import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://wnersexjjephtuliihhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZXJzZXhqamVwaHR1bGlpaGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MDk0MjEsImV4cCI6MjEwMTk4NTQyMX0.SHvoIjlx9IVJ8UOi5qBumLGx9zfv5Zau8OjH3JE-Vpc'
);

async function main() {
  try {
    const { data, error } = await sb.auth.getSession();
    if (error) {
      console.log('Erro sessão:', error.message);
    } else {
      console.log('Conexão Supabase OK! Sessão:', data.session ? 'Autenticado' : 'Não autenticado (esperado no terminal)');
    }

    // Testar tabela profiles
    const { data: profiles, error: profErr } = await sb.from('profiles').select('*').limit(5);
    if (profErr) {
      console.log('Tabela profiles erro:', profErr.message);
    } else {
      console.log('Tabela profiles OK - registros encontrados:', profiles.length);
    }

    // Testar tabela tabelas_frete
    const { data: tabelas, error: tabErr } = await sb.from('tabelas_frete').select('*').limit(5);
    if (tabErr) {
      console.log('Tabela tabelas_frete erro:', tabErr.message);
    } else {
      console.log('Tabela tabelas_frete OK - registros encontrados:', tabelas.length);
    }

    console.log('\n✅ Supabase configurado com sucesso!');
    console.log('Project URL: https://wnersexjjephtuliihhg.supabase.co');
  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}

main();
