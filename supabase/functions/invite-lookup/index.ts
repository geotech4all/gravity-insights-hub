import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: invite, error } = await admin
      .from('organization_invites')
      .select('id, org_id, email, role, expires_at, accepted_at, organizations(name, slug, type)')
      .eq('token', token)
      .maybeSingle();

    if (error || !invite) {
      return new Response(JSON.stringify({ error: 'Invitation not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This invitation has expired' }), {
        status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const org = (invite as any).organizations || {};
    return new Response(JSON.stringify({
      invite: {
        id: invite.id,
        org_id: invite.org_id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        accepted_at: invite.accepted_at,
        org_name: org.name,
        org_slug: org.slug,
        org_type: org.type,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
