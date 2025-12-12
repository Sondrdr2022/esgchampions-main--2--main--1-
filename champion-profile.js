// champion-profile.js
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof supabaseClient === 'undefined') {
    console.error('supabaseClient not found on profile page');
    return;
  }

  const form = document.getElementById('account-settings-form');
  if (!form) {
    console.error('account-settings-form not found');
    return;
  }

  // Status elements (created if not present)
  let statusEl = document.getElementById('save-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'save-status';
    statusEl.style.margin = '10px 0 15px 0';
    form.prepend(statusEl);
  }
  let deleteEl = document.getElementById('delete-status');
  if (!deleteEl) {
    deleteEl = document.createElement('div');
    deleteEl.id = 'delete-status';
    deleteEl.style.margin = '10px 0 10px 0';
    form.appendChild(deleteEl);
  }

  // Add Delete Account button if not present
  if (!document.getElementById('delete-account-btn')) {
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-secondary';
    delBtn.textContent = 'Delete Account';
    delBtn.id = 'delete-account-btn';
    delBtn.style.marginTop = '2rem';
    form.appendChild(delBtn);
  }

  const $ = (id) => document.getElementById(id);

  // Helpers
  function setValue(id, value) {
    const el = $(id);
    if (!el) return;
    // For selects, ensure the option exists; otherwise, set value and let UI show default
    el.value = value ?? "";
  }
  function getValue(id) {
    const el = $(id);
    if (!el) return "";
    return (el.value ?? "").toString();
  }

  // 1) Get the logged-in user
  const { data: userData, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !userData?.user) {
    window.location.href = "champion-login.html";
    return;
  }
  const user = userData.user;

  // 2) Load champion row
  const { data: champion, error: profileError } = await supabaseClient
    .from("champions")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    statusEl.textContent = "Failed to load your profile.";
    statusEl.style.color = "red";
    console.error("Error loading profile:", profileError);
    return;
  }

  // 3) Prefill UI from backend
  setValue("email", user.email || "");
  setValue("first_name", champion?.first_name);
  setValue("last_name", champion?.last_name);
  setValue("organization", champion?.organization);
  setValue("role", champion?.role);
  setValue("mobile", champion?.mobile);
  setValue("office_phone", champion?.office_phone);
  setValue("linkedin", champion?.linkedin);
  setValue("website", champion?.website);
  setValue("esg_competence", champion?.competence);
  setValue("esg_contributions", champion?.contributions);
  setValue("sector_focus", champion?.primary_sector);
  setValue("expertise", champion?.expertise_panels);

  // 4) Save handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusEl.textContent = "";
    statusEl.style.color = "";
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";
    }

    const requiredFields = [
      "first_name",
      "last_name",
      "organization",
      "role",
      "mobile",
      "sector_focus",
      "expertise",
    ];
    for (const id of requiredFields) {
      if (!getValue(id).trim()) {
        statusEl.textContent = "Please fill in all required fields.";
        statusEl.style.color = "red";
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Save Changes";
        }
        return;
      }
    }

    const updatePayload = {
      first_name: getValue("first_name").trim(),
      last_name: getValue("last_name").trim(),
      organization: getValue("organization").trim(),
      role: getValue("role").trim(),
      mobile: getValue("mobile").trim(),
      office_phone: getValue("office_phone").trim(),
      linkedin: getValue("linkedin").trim(),
      website: getValue("website").trim(),
      competence: getValue("esg_competence").trim(),
      contributions: getValue("esg_contributions").trim(),
      primary_sector: getValue("sector_focus").trim(),
      expertise_panels: getValue("expertise").trim(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from("champions")
      .update(updatePayload)
      .eq("id", user.id);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Changes";
    }

    if (updateError) {
      statusEl.textContent = "Error saving profile. Try again.";
      statusEl.style.color = "red";
      console.error(updateError);
      return;
    }

    statusEl.textContent = "Profile saved successfully!";
    statusEl.style.color = "green";
  });

  // 5) Delete account handler
  const deleteBtn = document.getElementById('delete-account-btn');
  if (deleteBtn) {
    deleteBtn.onclick = async function () {
      if (!confirm(
        "Are you sure you want to delete your account? This cannot be undone and will remove all your information."
      )) {
        return;
      }
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
      deleteEl.textContent = "";
      deleteEl.style.color = "";

      // Delete champion row for this user
      const { error: dbErr } = await supabaseClient
        .from('champions')
        .delete()
        .eq('id', user.id);

      if (dbErr) {
        deleteEl.textContent = "Error deleting user data. Try again.";
        deleteEl.style.color = "red";
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete Account';
        console.error(dbErr);
        return;
      }

      // Sign out the user
      try {
        await supabaseClient.auth.signOut();
        deleteEl.textContent = "Account deleted.";
        deleteEl.style.color = "green";
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1300);
      } catch (ex) {
        deleteEl.textContent = "Account data deleted, but error logging out.";
        deleteEl.style.color = "orange";
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1200);
      }
    };
  }
});