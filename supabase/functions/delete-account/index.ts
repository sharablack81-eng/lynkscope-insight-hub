import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Delete account function called')
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Client with user token for verification
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get the user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Deleting account for user:', user.id)

    // Create admin client for deletion
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Delete user data from public tables (cascade will handle related data)
    console.log('Deleting user data from multiple tables for user:', user.id)

    // First, gather link IDs owned by the user so we can remove related click records
    const { data: userLinks } = await supabaseAdmin
      .from('links')
      .select('id')
      .eq('user_id', user.id);

    const linkIds = Array.isArray(userLinks) ? userLinks.map((l: any) => l.id) : [];

    // Remove click/analytics records that reference these links or merchant id
    if (linkIds.length > 0) {
      await supabaseAdmin.from('smart_link_clicks').delete().in('link_id', linkIds);
      await supabaseAdmin.from('link_clicks').delete().in('link_id', linkIds);
    }

    // Remove smart clicks that reference merchant id directly
    await supabaseAdmin.from('smart_link_clicks').delete().eq('merchant_id', user.id);

    // Remove short links, links, expire rules, ab tests, and other user-scoped tables
    await supabaseAdmin.from('short_links').delete().eq('user_id', user.id);
    await supabaseAdmin.from('expire_links').delete().eq('user_id', user.id);
    await supabaseAdmin.from('ab_tests').delete().eq('user_id', user.id);
    await supabaseAdmin.from('links').delete().eq('user_id', user.id);
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);

    // Subscriptions/merchants should also be removed
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', user.id);
    await supabaseAdmin.from('merchants').delete().eq('user_id', user.id);

    // Delete the auth user
    console.log('Deleting auth user')
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      throw deleteError
    }

    console.log('Account deletion successful')
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in delete-account function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
