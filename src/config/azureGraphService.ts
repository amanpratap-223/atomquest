/**
 * azureGraphService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * After MSAL SSO login, call Microsoft Graph API to:
 *  1. Fetch user's org hierarchy (manager attribute)
 *  2. Fetch user's Azure AD group membership → map to AtomQuest roles
 *
 * Usage: called automatically in LoginPage after a successful loginPopup()
 *
 * Requires: VITE_AZURE_TENANT_ID + VITE_AZURE_CLIENT_ID in .env.local
 */

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// Azure AD Group → AtomQuest Role mapping
// Configure these Group Object IDs in your Azure AD tenant
const GROUP_ROLE_MAP: Record<string, 'employee' | 'manager' | 'admin'> = {
  // Example: replace with your actual Azure AD Group Object IDs
  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': 'admin',
  // 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy': 'manager',
};

interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  jobTitle: string;
  department: string;
  manager?: { id: string; displayName: string; mail: string };
}

interface GraphGroup {
  id: string;
  displayName: string;
}

// ─── Fetch user profile + manager from Graph ──────────────────────────────────
export async function fetchGraphProfile(accessToken: string): Promise<GraphUser | null> {
  try {
    // Get user profile with manager
    const res = await fetch(`${GRAPH_BASE}/me?$select=id,displayName,mail,jobTitle,department`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Graph /me returned ${res.status}`);
    const user = await res.json();

    // Get manager (org hierarchy)
    const mgrRes = await fetch(`${GRAPH_BASE}/me/manager?$select=id,displayName,mail`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (mgrRes.ok) {
      user.manager = await mgrRes.json();
    }

    return user;
  } catch (err) {
    console.warn('[AzureGraph] Could not fetch profile:', err);
    return null;
  }
}

// ─── Fetch group membership → derive AtomQuest role ──────────────────────────
export async function fetchGraphRole(accessToken: string): Promise<'employee' | 'manager' | 'admin' | null> {
  try {
    const res = await fetch(`${GRAPH_BASE}/me/memberOf?$select=id,displayName`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Graph /memberOf returned ${res.status}`);
    const { value: groups }: { value: GraphGroup[] } = await res.json();

    for (const group of groups) {
      if (GROUP_ROLE_MAP[group.id]) {
        console.log(`[AzureGraph] Role mapped from group "${group.displayName}" → ${GROUP_ROLE_MAP[group.id]}`);
        return GROUP_ROLE_MAP[group.id];
      }
    }

    console.log('[AzureGraph] No role group matched — defaulting to employee');
    return 'employee';
  } catch (err) {
    console.warn('[AzureGraph] Could not fetch groups:', err);
    return null;
  }
}

// ─── Main: sync Azure AD profile into app user session ───────────────────────
export async function syncAzureADUser(accessToken: string) {
  const [profile, role] = await Promise.all([
    fetchGraphProfile(accessToken),
    fetchGraphRole(accessToken),
  ]);

  return {
    azureId:     profile?.id,
    name:        profile?.displayName,
    email:       profile?.mail?.toLowerCase(),
    designation: profile?.jobTitle,
    department:  profile?.department,
    managerName: profile?.manager?.displayName,
    managerEmail: profile?.manager?.mail?.toLowerCase(),
    role:        role || 'employee',
  };
}
