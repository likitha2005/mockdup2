// =================== Navigation ===================
function hideAllSections() {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
}

function showSignup() {
  hideAllSections();
  document.getElementById('signup-section').classList.remove('hidden');
}

function showLogin() {
  hideAllSections();
  document.getElementById("login-section").classList.remove("hidden");
}

function showDashboard() {
  hideAllSections();
  document.getElementById("dashboard-section").classList.remove("hidden");
  document.getElementById("login-btn").classList.add("hidden");
  document.getElementById("user-controls").classList.remove("hidden");
}

function logout() {
  localStorage.removeItem("token"); // clear token
  hideAllSections();
  document.getElementById("login-btn").classList.remove("hidden");
  document.getElementById("user-controls").classList.add("hidden");
  document.getElementById("home-section").classList.remove("hidden");
}

// =================== Signup/Login ===================
async function handleSignup(event) {
  event.preventDefault();
  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const nameRegex = /^[A-Za-z]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;


  if (!nameRegex.test(fullname)) return alert("Please enter your full name.");
  if (!emailRegex.test(email)) return alert("Invalid email format.");
  if (!passwordRegex.test(password)) return alert("Password must have 1 uppercase, 1 lowercase, 1 number and 8+ characters.");

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullname, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return alert(data.error || "Signup failed");
    }

    localStorage.setItem('token', data.token);
    alert(data.message || "Signup successful");
    showDashboard();

  } catch (err) {
    console.error(err);
    alert("Signup error");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pass").value;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

  if (!emailRegex.test(email)) return alert("Enter a valid email.");
  if (!passwordRegex.test(password)) return alert("Invalid password format.");

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return alert(data.error || "Login failed");
    }

    localStorage.setItem('token', data.token);
    alert(data.message || "Login successful");
    showDashboard();
    fetchProjects(); // Load projects after login

  } catch (err) {
    console.error(err);
    alert("Login error");
  }
}

function closeAuth() {
  document.getElementById('signup-section').classList.add('hidden');
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('home-section').classList.remove('hidden');
}

// =================== Optional: Protected Route Example ===================
async function fetchProtectedData() {
  const token = localStorage.getItem('token');
  if (!token) return alert("Not logged in.");

  try {
    const res = await fetch('/api/protected', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
    } else {
      alert(data.error || "Access denied");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to fetch protected data");
  }
}

function createProjectInBackend(name, prefix = '') {
  const token = localStorage.getItem('token');
  
  fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ name, prefix })
  })
  .then(async res => {
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    return res.json();
  })
  .then(data => {
    if (data.projectId) {
      alert('✅ Project created!');
      fetchProjects(); // Refresh list
    } else {
      alert(data.error || 'Failed to create project');
    }
  })
  .catch(err => {
    console.error("❌ Project creation error:", err.message);
    alert("Server error: " + err.message);
  });
}

let currentProject = null;

function fetchProjects() {
  const token = localStorage.getItem('token');

  fetch('/api/projects', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(projects => {
      const list = document.getElementById('project-list');
      list.innerHTML = '';

      if (projects.length === 0) {
        list.innerHTML = '<p>No projects yet. Click + to create one.</p>';
        return;
      }

      projects.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'project-card';

        card.innerHTML = `
          <h3>${p.name}</h3>
          <p class="prefix">Base URL: /${p.prefix}</p>
          <div class="card-actions">
            <button class="btn btn-small" onclick="openProject(${p.id}, '${p.name}', '${p.prefix}')">Open</button>
            <button class="btn btn-small btn-danger" onclick="deleteProject(${p.id})">🗑 Delete</button>
          </div>
        `;

        list.appendChild(card);
      });
    });
}

function openProjectModal() {
  document.getElementById("project-modal").classList.remove("hidden");
}

function closeProjectModal() {
  document.getElementById("project-modal").classList.add("hidden");
  document.getElementById("project-name-input").value = '';
  document.getElementById("project-prefix-input").value = '';
}

function handleProjectCreate() {
  const name = document.getElementById("project-name-input").value.trim();
  const prefix = document.getElementById("project-prefix-input").value.trim();

  if (!name) return alert("Please enter a project name");

  createProjectInBackend(name, prefix);
  closeProjectModal();
}

function createProjectInBackend(name, prefix) {
  const token = localStorage.getItem('token');

  fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, prefix })
  })
    .then(res => res.json())
    .then(() => fetchProjects())
    .catch(err => console.error("Project creation error:", err));
}

function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to delete a project.');
    return;
  }

  fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(error => {
          console.error('Delete failed:', error);
          throw new Error(error.error || 'Delete failed');
        });
      }
      return res.json();
    })
    .then(() => {
      alert('Project deleted');
      fetchProjects(); // Refresh the list
    })
    .catch(err => {
      console.error(err);
      alert('Unable to delete project.');
    });
}


function openProject(id, name, prefix) {
  currentProject = { id, name, prefix };

  document.getElementById("resource-builder").classList.remove("hidden");
  document.getElementById("current-project-name").textContent = name;
  document.getElementById("resource-create-form").classList.add("hidden");
  document.getElementById("endpoint-preview").classList.add("hidden");
  document.getElementById("create-resource-btn").classList.remove("hidden");

  fetchResourcesForProject(prefix);
}

function fetchResourcesForProject(prefix) {
  const token = localStorage.getItem('token');
  const container = document.getElementById("existing-resources");
  container.innerHTML = '';

  fetch(`/api/resources/${prefix}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(resources => {
      if (!Array.isArray(resources)) {
        container.innerHTML = '<p>Failed to load resources.</p>';
        return;
      }

      if (resources.length === 0) {
        container.innerHTML = '<p>No resources yet.</p>';
        return;
      }

      resources.forEach(resource => {
        const item = document.createElement('div');
        item.className = 'resource-card';
        item.innerHTML = `
          <h4>${resource.name}</h4>
          <p><strong>Fields:</strong> ${resource.fields.map(f => `${f.name} (${f.type})`).join(', ')}</p>
          <p><strong>Records:</strong> ${resource.count}</p>
          <code>http://localhost:3000/api/${prefix}/${resource.name}</code>
        `;
        container.appendChild(item);
      });
    })
    .catch(err => {
      console.error("Error fetching resources:", err);
      container.innerHTML = '<p>Error loading resources.</p>';
    });
}

function submitResource() {
  const name = document.getElementById("resource-name").value.trim();
  const count = parseInt(document.getElementById("num-rows").value || '10');
  const token = localStorage.getItem('token');

  if (!name || !currentProject?.id) {
    alert("Missing project or resource name");
    return;
  }

  const fields = [];
  document.querySelectorAll('.field-row').forEach(row => {
    const fieldName = row.querySelector('input').value.trim();
    const fieldType = row.querySelector('select').value;
    if (fieldName) fields.push({ name: fieldName, type: fieldType });
  });

  if (fields.length === 0) return alert("Add at least one field");

  fetch('/api/resources', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      projectId: currentProject.id,
      name,
      fields,
      count
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert("✅ Resource created");

        fetchResourcesForProject(currentProject.prefix);

        document.getElementById("endpoint-url").textContent =
          `http://localhost:3000/api/${currentProject.prefix}/${name}`;
        document.getElementById("endpoint-preview").classList.remove("hidden");

        document.getElementById("resource-name").value = '';
        document.getElementById("num-rows").value = 10;
        document.getElementById("row-count").textContent = 10;
        document.getElementById("fields-container").innerHTML = '';
        addField();

        document.getElementById("create-resource-btn").classList.add("hidden");
      } else {
        alert(data.error || "Something went wrong");
      }
    })
    .catch(err => {
      console.error("Resource error:", err);
      alert("Server error");
    });
}

function addField() {
  const container = document.getElementById("fields-container");

  const row = document.createElement("div");
  row.className = "field-row";
  row.innerHTML = `
    <input type="text" placeholder="Field Name (e.g. email)" class="field-name-input" />
    <select class="field-type-select">
      <option value="word">String</option>
      <option value="number">Number</option>
      <option value="boolean">Boolean</option>
      <option value="name">Name</option>
      <option value="email">Email</option>
      <option value="phone">Phone</option>
      <option value="date">Date</option>
      <option value="word">Word</option>
      <option value="uuid">UUID</option>
    </select>
    <button class="btn small danger" onclick="this.parentElement.remove()">❌</button>
  `;

  container.appendChild(row);
}

function updateRowCount(val) {
  document.getElementById("row-count").textContent = val;
}

function showResourceForm() {
  document.getElementById("resource-create-form").classList.remove("hidden");
  document.getElementById("create-resource-btn").classList.add("hidden");

  document.getElementById("resource-name").value = '';
  document.getElementById("fields-container").innerHTML = '';
  document.getElementById("num-rows").value = 10;
  document.getElementById("row-count").textContent = 10;
  addField();
}
