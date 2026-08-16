const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


// =========================================================
// HELPERS
// =========================================================

function getErrorMessage(data, fallbackMessage) {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item.msg || JSON.stringify(item))
      .join(", ");
  }

  if (data?.detail && typeof data.detail === "object") {
    return JSON.stringify(data.detail);
  }

  return fallbackMessage;
}


function getAdminToken() {
  return sessionStorage.getItem(
    "supportops_admin_token"
  );
}


function getAdminHeaders() {
  const token = getAdminToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// =========================================================
// ADMIN AUTHENTICATION
// =========================================================

export async function adminLogin(email, password) {
  const response = await fetch(
    `${API_URL}/admin/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not sign in"
      )
    );
  }

  return data;
}


export function saveAdminSession(data) {
  sessionStorage.setItem(
    "supportops_admin_token",
    data.access_token
  );

  sessionStorage.setItem(
    "supportops_admin",
    JSON.stringify(data.admin)
  );
}


export function getAdminSession() {
  const token = sessionStorage.getItem(
    "supportops_admin_token"
  );

  const storedAdmin = sessionStorage.getItem(
    "supportops_admin"
  );

  if (!token || !storedAdmin) {
    return null;
  }

  try {
    return {
      token,
      admin: JSON.parse(storedAdmin),
    };
  } catch {
    clearAdminSession();
    return null;
  }
}

// =========================================================
// ADMIN SESSION HANDLING
// =========================================================

function handleAdminUnauthorized(response) {
  if (response.status !== 401) {
    return false;
  }

  clearAdminSession();

  if (
    window.location.pathname.startsWith(
      "/admin"
    )
  ) {
    window.location.replace("/admin");
  }

  return true;
}

export function clearAdminSession() {
  sessionStorage.removeItem(
    "supportops_admin_token"
  );

  sessionStorage.removeItem(
    "supportops_admin"
  );
}

async function adminFetch(
  url,
  options = {}
) {
  const response = await fetch(
    url,
    options
  );

  if (response.status === 401) {
    handleAdminUnauthorized(response);

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return response;
}

// =========================================================
// AGENTS
// =========================================================

export async function getAgents() {
  const response = await adminFetch(
    `${API_URL}/agents`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load agents"
      )
    );
  }

  return data;
}


export async function getAgent(agentId) {
  const response = await adminFetch(
    `${API_URL}/agents/${agentId}`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load agent"
      )
    );
  }

  return data;
}


export async function createAgent(agent) {
  const response = await adminFetch(
    `${API_URL}/agents`,
    {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(agent),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not create agent"
      )
    );
  }

  return data;
}


export async function generateAgentAccessCode(
  agentId
) {
  const response = await adminFetch(
    `${API_URL}/agents/${agentId}/access-code`,
    {
      method: "POST",
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not generate access code"
      )
    );
  }

  return data;
}

  export async function updateAgentStatus(
  agentId,
  status
) {
  const response = await adminFetch(
    `${API_URL}/agents/${agentId}/status`,
    {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        status,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not update agent status"
      )
    );
  }

  return data;
}


export async function deleteAgent(
  agentId
) {
  const response = await adminFetch(
    `${API_URL}/agents/${agentId}`,
    {
      method: "DELETE",
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not delete agent"
      )
    );
  }

  return data;
}




// =========================================================
// ADMIN OVERTIME
// =========================================================

export async function getOvertimeRequests() {
  const response = await adminFetch(
    `${API_URL}/overtime`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load overtime requests"
      )
    );
  }

  return data;
}


export async function getAgentOvertime(
  agentId
) {
  const response = await adminFetch(
    `${API_URL}/agents/${agentId}/overtime`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load agent overtime"
      )
    );
  }

  return data;
}


export async function approveOvertime(
  overtimeId,
  adminComment = ""
) {
 const response = await adminFetch(
    `${API_URL}/overtime/${overtimeId}/approve`,
    {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        admin_comment: adminComment || null,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not approve overtime"
      )
    );
  }

  return data;
}


export async function rejectOvertime(
  overtimeId,
  adminComment = ""
) {
  const response = await adminFetch(
    `${API_URL}/overtime/${overtimeId}/reject`,
    {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        admin_comment: adminComment || null,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not reject overtime"
      )
    );
  }

  return data;
}

export async function deleteOvertime(
  overtimeId
) {
  const response = await adminFetch(
    `${API_URL}/overtime/${overtimeId}`,
    {
      method: "DELETE",
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not delete overtime request"
      )
    );
  }

  return data;
}

// =========================================================
// ATTENDANCE
// =========================================================

export async function getAttendanceRecords() {
  const response = await adminFetch(
    `${API_URL}/attendance`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load attendance records"
      )
    );
  }

  return data;
}


export async function getAgentAttendance(
  agentId
) {
  const response = await adminFetch(
    `${API_URL}/attendance/agent/${agentId}`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load agent attendance"
      )
    );
  }

  return data;
}


export async function createAttendanceRecord(
  record
) {
  const response = await adminFetch(
    `${API_URL}/attendance`,
    {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(record),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not create attendance record"
      )
    );
  }

  return data;
}

export async function deleteAttendanceRecord(
  recordId
) {
  const response = await adminFetch(
    `${API_URL}/attendance/${recordId}`,
    {
      method: "DELETE",
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not delete attendance record"
      )
    );
  }

  return data;
}

// =========================================================
// FOLLOW-UPS
// =========================================================

export async function getFollowUps() {
  const response = await adminFetch(
    `${API_URL}/followups`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load follow-ups"
      )
    );
  }

  return data;
}


export async function getAgentFollowUps(
  agentId
) {
  const response = await adminFetch(
    `${API_URL}/followups/agent/${agentId}`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load agent follow-ups"
      )
    );
  }

  return data;
}


export async function createFollowUp(
  followUp
) {
  const response = await adminFetch(
    `${API_URL}/followups`,
    {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(followUp),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not create follow-up"
      )
    );
  }

  return data;
}


export async function updateFollowUpStatus(
  followUpId,
  newStatus
) {
  const response = await adminFetch(
    `${API_URL}/followups/${followUpId}/status`,
    {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        status: newStatus,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not update follow-up status"
      )
    );
  }

  return data;
}

export async function deleteFollowUp(
  followUpId
) {
  const response = await adminFetch(
    `${API_URL}/followups/${followUpId}`,
    {
      method: "DELETE",
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not delete follow-up"
      )
    );
  }

  return data;
}

// =========================================================
// TIME OFF
// =========================================================

export async function getTimeOffRecords() {
 const response = await adminFetch(
    `${API_URL}/timeoff`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load time off records"
      )
    );
  }

  return data;
}


export async function getAgentTimeOff(
  agentId
) {
  const response = await adminFetch(
    `${API_URL}/timeoff/agent/${agentId}`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load agent time off"
      )
    );
  }

  return data;
}


export async function createTimeOffRecord(
  record
) {
  const response = await adminFetch(
    `${API_URL}/timeoff`,
    {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(record),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not create time off record"
      )
    );
  }

  return data;
}
export async function deleteTimeOffRecord(
  recordId
) {
  const response = await adminFetch(
    `${API_URL}/timeoff/${recordId}`,
    {
      method: "DELETE",
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not delete time off record"
      )
    );
  }

  return data;
}

// =========================================================
// REPORTS
// =========================================================

export async function getReports() {
  const response = await adminFetch(
    `${API_URL}/reports`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load reports"
      )
    );
  }

  return data;
}


export async function getAgentReports(
  agentId
) {
  const response = await adminFetch(
    `${API_URL}/reports/agent/${agentId}`,
    {
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not load agent reports"
      )
    );
  }

  return data;
}


export async function createReport(
  formData
) {
  const token = getAdminToken();

  const response = await adminFetch(
    `${API_URL}/reports`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not create report"
      )
    );
  }

  return data;
}


export async function downloadReportAttachment(
  attachmentId
) {
  const token = getAdminToken();

  const response = await adminFetch(
    `${API_URL}/reports/attachments/${attachmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message =
      "Could not open attachment";

    try {
      const data = await response.json();

      message = getErrorMessage(
        data,
        message
      );
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return response.blob();
}

export async function deleteReport(
  reportId
) {
  const response = await adminFetch(
    `${API_URL}/reports/${reportId}`,
    {
      method: "DELETE",
      headers: getAdminHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not delete report"
      )
    );
  }

  return data;
}

// =========================================================
// AGENT PORTAL
// =========================================================

export async function agentPortalLogin(
  accessCode
) {
  const response = await fetch(
    `${API_URL}/agent-portal/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_code: accessCode,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Invalid access code"
      )
    );
  }

  return data;
}


export async function createOvertimeRequest(
  overtime,
  accessToken
) {
  const response = await fetch(
    `${API_URL}/agent/overtime`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(overtime),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        "Could not submit overtime request"
      )
    );
  }

  return data;
}