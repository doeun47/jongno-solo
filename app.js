// --- GEOGRAPHIC COORDINATES FOR JONGNO AREAS (For Route Sorting) ---
const AREA_COORDS = {
  "서촌": { x: 50, y: 50 },
  "삼청동": { x: 130, y: 30 },
  "북촌": { x: 220, y: 40 },
  "인사동": { x: 180, y: 140 },
  "익선동": { x: 280, y: 150 }
};

// --- GLOBAL STATE ---
const state = {
  user: null, // { id, isMember, age, gender, nationality }
  surveyAnswers: {
    age: "20",
    gender: "female",
    nationality: "korean",
    purpose: ["힐링"],
    style: "조용함",
    budget: 30000,
    duration: "2"
  },
  currentCourse: null,
  smsSentCode: null,
  isSmsVerified: false
};

// --- INITIALIZE & ROUTER ---
document.addEventListener("DOMContentLoaded", () => {
  initLocalStorage();
  bindEvents();
  checkShareLink();
});

// Initialize localStorage databases if empty
function initLocalStorage() {
  if (!localStorage.getItem("users")) localStorage.setItem("users", JSON.stringify([]));
  if (!localStorage.getItem("savedCourses")) localStorage.setItem("savedCourses", JSON.stringify([]));
  if (!localStorage.getItem("favorites")) localStorage.setItem("favorites", JSON.stringify([]));
  if (!localStorage.getItem("reviews")) localStorage.setItem("reviews", JSON.stringify([]));
  if (!localStorage.getItem("sharedCourses")) localStorage.setItem("sharedCourses", JSON.stringify([]));
}

// Route to screen
function showView(viewId) {
  document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add("active");

  const header = document.getElementById("common-header");
  if (viewId === "view-splash") {
    header.style.display = "none";
  } else {
    header.style.display = "flex";
  }

  // Manage Nav icons active/inactive states
  if (state.user) {
    document.getElementById("btn-nav-logout").style.display = state.user.isMember ? "block" : "none";
  } else {
    document.getElementById("btn-nav-logout").style.display = "none";
  }

  // Scroll to top of app container
  document.getElementById("app-container").scrollTop = 0;
}

// Show toast alert
function showToast(message) {
  const toast = document.getElementById("toast-msg");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Bind interaction events
function bindEvents() {
  // Splash Start
  document.getElementById("btn-splash-start").addEventListener("click", () => {
    showView("view-auth");
  });

  // Home Button (Reset)
  document.getElementById("btn-nav-home").addEventListener("click", () => {
    if (state.user) {
      resetSurvey();
      showView("view-survey");
    } else {
      showView("view-splash");
    }
  });

  // My Page Button
  document.getElementById("btn-nav-mypage").addEventListener("click", () => {
    renderMyPage();
    showView("view-mypage");
  });

  // Logout Button
  document.getElementById("btn-nav-logout").addEventListener("click", () => {
    state.user = null;
    showToast("로그아웃 되었습니다.");
    showView("view-splash");
  });

  // Auth Tabs
  document.getElementById("tab-login").addEventListener("click", () => {
    document.getElementById("tab-login").classList.add("active");
    document.getElementById("tab-signup").classList.remove("active");
    document.getElementById("form-login-container").style.display = "block";
    document.getElementById("form-signup-container").style.display = "none";
  });

  document.getElementById("tab-signup").addEventListener("click", () => {
    document.getElementById("tab-signup").classList.add("active");
    document.getElementById("tab-login").classList.remove("active");
    document.getElementById("form-signup-container").style.display = "block";
    document.getElementById("form-login-container").style.display = "none";
  });

  // SMS Verification
  document.getElementById("btn-send-sms").addEventListener("click", () => {
    const phoneInput = document.getElementById("signup-phone").value.trim();
    if (!phoneInput) {
      showToast("휴대폰 번호를 입력해 주세요.");
      return;
    }
    // Generate a random 6 digit verification code
    state.smsSentCode = Math.floor(100000 + Math.random() * 900000).toString();
    document.getElementById("sms-code-box").style.display = "flex";
    showToast(`인증코드가 발송되었습니다.`);
    alert(`[종로솔로 본인인증]\n인증코드: ${state.smsSentCode}`);
  });

  document.getElementById("btn-verify-sms").addEventListener("click", () => {
    const codeInput = document.getElementById("signup-sms-code").value.trim();
    if (codeInput === state.smsSentCode) {
      state.isSmsVerified = true;
      document.getElementById("sms-verified-msg").style.display = "block";
      document.getElementById("sms-code-box").style.display = "none";
      document.getElementById("btn-send-sms").disabled = true;
      document.getElementById("signup-phone").disabled = true;
      document.getElementById("btn-submit-signup").disabled = false;
      showToast("본인인증이 확인되었습니다!");
    } else {
      showToast("인증번호가 올바르지 않습니다.");
    }
  });

  // Signup Submit
  document.getElementById("btn-submit-signup").addEventListener("click", () => {
    const id = document.getElementById("signup-id").value.trim();
    const pw = document.getElementById("signup-pw").value.trim();
    if (id.length < 4 || pw.length < 6) {
      showToast("아이디는 4자 이상, 비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users"));
    if (users.find(u => u.id === id)) {
      showToast("이미 존재하는 아이디입니다.");
      return;
    }

    const newUser = { id, pw, age: "20", gender: "female", nationality: "korean" };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    state.user = { id, isMember: true, age: "20", gender: "female", nationality: "korean" };
    showToast("회원가입이 완료되었습니다!");
    resetSurvey();
    showView("view-survey");
  });

  // Login Submit
  document.getElementById("btn-submit-login").addEventListener("click", () => {
    const id = document.getElementById("login-id").value.trim();
    const pw = document.getElementById("login-pw").value.trim();

    const users = JSON.parse(localStorage.getItem("users"));
    const matched = users.find(u => u.id === id && u.pw === pw);

    if (matched) {
      state.user = { id, isMember: true, age: matched.age || "20", gender: matched.gender || "female", nationality: matched.nationality || "korean" };
      showToast(`${id}님, 환영합니다!`);
      resetSurvey();
      showView("view-survey");
    } else {
      showToast("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  });

  // Skip Login (Guest)
  document.getElementById("btn-skip-auth").addEventListener("click", () => {
    state.user = { id: "guest_" + Math.random().toString(36).substr(2, 5), isMember: false, age: "20", gender: "female", nationality: "korean" };
    showToast("비회원으로 시작합니다.");
    resetSurvey();
    showView("view-survey");
  });

  // Option Cards selection inside Survey Wizard
  document.querySelectorAll(".option-card").forEach(card => {
    card.addEventListener("click", () => {
      const field = card.dataset.field;
      const value = card.dataset.value;

      if (field === "purpose") {
        // Multi-select for purpose
        if (card.classList.contains("selected")) {
          // Keep at least one selected
          const selectedForField = card.parentElement.querySelectorAll(".option-card.selected");
          if (selectedForField.length > 1) {
            card.classList.remove("selected");
          }
        } else {
          card.classList.add("selected");
        }
      } else {
        // Single-select for other fields
        card.parentElement.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
      }

      updateSurveyStateFromUI();
    });
  });

  // Budget Slider Input
  const budgetSlider = document.getElementById("survey-budget");
  budgetSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    const valueDisplay = document.getElementById("budget-value");
    if (val === 0) {
      valueDisplay.textContent = "무료 관광 코스";
    } else if (val >= 100000) {
      valueDisplay.textContent = "100,000 원+ (예산 무제한)";
    } else {
      valueDisplay.textContent = val.toLocaleString() + " 원";
    }
    state.surveyAnswers.budget = val;
  });

  // Survey Wizard Stepper Navigation
  const btnPrev = document.getElementById("btn-wizard-prev");
  const btnNext = document.getElementById("btn-wizard-next");
  let currentStep = 1;

  btnNext.addEventListener("click", () => {
    if (currentStep < 3) {
      currentStep++;
      updateWizardStep(currentStep);
    } else {
      // Step 3 Next clicked -> Generate course!
      generateCourseAndShow();
    }
  });

  btnPrev.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep--;
      updateWizardStep(currentStep);
    }
  });

  function updateWizardStep(step) {
    currentStep = step;
    
    // Toggle active step divs
    document.querySelectorAll(".wizard-step").forEach((ws, idx) => {
      if (idx + 1 === step) {
        ws.classList.add("active");
      } else {
        ws.classList.remove("active");
      }
    });

    // Toggle active dot indicators
    document.querySelectorAll(".step-dot").forEach((dot, idx) => {
      const dotStep = idx + 1;
      dot.classList.remove("active", "completed");
      if (dotStep === step) {
        dot.classList.add("active");
      } else if (dotStep < step) {
        dot.classList.add("completed");
      }
    });

    // Toggle footer buttons
    btnPrev.style.visibility = step === 1 ? "hidden" : "visible";
    btnNext.textContent = step === 3 ? "코스 생성하기" : "다음 단계";
  }

  // Dashboard actions
  document.getElementById("btn-save-course").addEventListener("click", saveCurrentCourse);
  document.getElementById("btn-share-course").addEventListener("click", shareCurrentCourse);
  document.getElementById("btn-reshuffle-course").addEventListener("click", () => {
    generateCourseAndShow();
    showToast("코스가 새로 고쳐졌습니다! 🔄");
  });
  document.getElementById("btn-recreate-course").addEventListener("click", () => {
    resetSurvey();
    updateWizardStep(1);
    showView("view-survey");
  });

  // Modal reviews
  document.getElementById("btn-open-review-modal").addEventListener("click", openReviewModal);
  document.querySelector(".modal-close-btn").addEventListener("click", closeReviewModal);
  document.getElementById("btn-submit-feedback").addEventListener("click", submitReviewFeedback);

  // Modal rating stars
  document.querySelectorAll(".rating-stars .star").forEach(star => {
    star.addEventListener("click", (e) => {
      const container = e.target.parentElement;
      const val = parseInt(e.target.dataset.value);
      container.dataset.rating = val;
      
      container.querySelectorAll(".star").forEach(s => {
        const starVal = parseInt(s.dataset.value);
        s.classList.toggle("active", starVal <= val);
      });
    });
  });

  // Accuracy feedback selector
  document.querySelectorAll("#accuracy-feedback-group .feedback-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll("#accuracy-feedback-group .feedback-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // My Page tab switching
  document.getElementById("mytab-courses").addEventListener("click", () => switchMyPageTab("courses"));
  document.getElementById("mytab-favorites").addEventListener("click", () => switchMyPageTab("favorites"));
  document.getElementById("mytab-reviews").addEventListener("click", () => switchMyPageTab("reviews"));
}

// Reset survey inputs
function resetSurvey() {
  state.surveyAnswers = {
    age: "20",
    gender: "female",
    nationality: "korean",
    purpose: ["힐링"],
    style: "조용함",
    budget: 30000,
    duration: "2"
  };

  // Reset UI classes to defaults
  document.querySelectorAll(".option-card").forEach(card => {
    const field = card.dataset.field;
    const value = card.dataset.value;
    
    let isDefault = false;
    if (field === "age" && value === "20") isDefault = true;
    if (field === "gender" && value === "female") isDefault = true;
    if (field === "nationality" && value === "korean") isDefault = true;
    if (field === "purpose" && value === "힐링") isDefault = true;
    if (field === "style" && value === "조용함") isDefault = true;
    if (field === "duration" && value === "2") isDefault = true;

    card.classList.toggle("selected", isDefault);
  });

  // Reset budget slider
  document.getElementById("survey-budget").value = 30000;
  document.getElementById("budget-value").textContent = "30,000 원";
}

// Read options from UI to update survey state
function updateSurveyStateFromUI() {
  const selectedCards = document.querySelectorAll(".option-card.selected");
  
  // Clear purposes array first
  state.surveyAnswers.purpose = [];

  selectedCards.forEach(card => {
    const field = card.dataset.field;
    const value = card.dataset.value;
    
    if (field === "purpose") {
      state.surveyAnswers.purpose.push(value);
    } else {
      state.surveyAnswers[field] = value;
    }
  });

  // Sync state.user demography if logged in
  if (state.user && state.user.isMember) {
    state.user.age = state.surveyAnswers.age;
    state.user.gender = state.surveyAnswers.gender;
    state.user.nationality = state.surveyAnswers.nationality;
  }
}

// --- COURSE GENERATOR MATCHING ENGINE ---
function generateCourseAndShow() {
  const answers = state.surveyAnswers;

  // 1. Scoring & filtering of JONGNO_SPOTS
  const scoredSpots = JONGNO_SPOTS.map(spot => {
    let score = 0;

    // A. Match Style (조용함 vs 활발함) - Weight: 40%
    if (spot.style === answers.style) {
      score += 40;
    }

    // B. Match Purposes (힐링, 문화, 맛집, 사진, 산책, 관광) - Weight: 40%
    const matchingPurposes = spot.purpose.filter(p => answers.purpose.includes(p));
    if (matchingPurposes.length > 0) {
      score += (matchingPurposes.length / answers.purpose.length) * 40;
    }

    // C. Budget Match - Weight: 20%
    // If spot budget is less than or close to answers budget per place
    const expectedPlaceCount = answers.duration === "2" ? 2 : (answers.duration === "5" ? 3 : 4);
    const targetBudgetPerPlace = answers.budget / expectedPlaceCount;
    
    if (spot.budget <= targetBudgetPerPlace) {
      score += 20;
    } else if (spot.budget <= targetBudgetPerPlace * 1.5) {
      score += 10;
    }

    // D. 다양성(Diversity) 부여를 위한 미세한 무작위 가중치 추가 (유사 매칭 시 동적 셔플 효과)
    score += Math.random() * 8;

    return { spot, score };
  });

  // Sort spots by descending match scores
  scoredSpots.sort((a, b) => b.score - a.score);

  // 2. Select spots by category representation
  const chosenSpots = [];
  const requiredCount = answers.duration === "2" ? 2 : (answers.duration === "5" ? 3 : 4);

  // Try to pick one from each category (Restaurant, Cafe, Popup, Shop) to create a diverse course
  const categories = ["restaurant", "cafe", "popup", "shop"];
  let catIndex = 0;

  // Make sure to match Restaurant first if "맛집" purpose was selected, etc.
  if (answers.purpose.includes("맛집")) {
    // Bring restaurant category to the front
    categories.splice(categories.indexOf("restaurant"), 1);
    categories.unshift("restaurant");
  }

  // Selection loop
  for (let i = 0; i < scoredSpots.length && chosenSpots.length < requiredCount; i++) {
    const item = scoredSpots[i];
    const categoryToPick = categories[catIndex % categories.length];

    // Check if we already have this spot
    if (chosenSpots.find(s => s.id === item.spot.id)) continue;

    // Pick it if it matches the current category search, or if we have looped through and need to fill the slot
    if (item.spot.category === categoryToPick || catIndex >= categories.length * 2) {
      chosenSpots.push(item.spot);
      catIndex++;
    }
  }

  // If still empty slots, grab the top remaining scored items
  for (let i = 0; i < scoredSpots.length && chosenSpots.length < requiredCount; i++) {
    const item = scoredSpots[i];
    if (!chosenSpots.find(s => s.id === item.spot.id)) {
      chosenSpots.push(item.spot);
    }
  }

  // 3. Route Optimization Sort (Nearest Neighbor Pathing)
  const sortedSpots = optimizeRoute(chosenSpots);

  // 4. Calculate metadata
  const totalBudget = sortedSpots.reduce((sum, s) => sum + s.budget, 0);
  const totalDurationHours = sortedSpots.reduce((sum, s) => sum + s.duration, 0) + (sortedSpots.length - 1) * 0.5; // adding 30 mins travel between each
  const averageMatchScore = Math.round(scoredSpots.filter(ss => sortedSpots.includes(ss.spot)).reduce((sum, ss) => sum + ss.score, 0) / sortedSpots.length);

  // Calculate Title based on areas
  const uniqueAreas = [...new Set(sortedSpots.map(s => s.area))];
  const primaryArea = uniqueAreas[0] || "종로";
  const purposesString = answers.purpose.join("·");
  const courseTitle = `${primaryArea} 나홀로 ${purposesString} 코스`;
  
  // Set current course in state
  state.currentCourse = {
    id: "course_" + Date.now(),
    title: courseTitle,
    spots: sortedSpots,
    budget: totalBudget,
    duration: totalDurationHours,
    matchScore: averageMatchScore
  };

  renderCourseResult();
  showView("view-result");
}

// Traveling Salesperson sorting based on X/Y coordinates
function optimizeRoute(spots) {
  if (spots.length <= 1) return spots;

  const remaining = [...spots];
  const sorted = [];

  // Start with the westernmost spot (lowest X coord)
  remaining.sort((a, b) => {
    const coordA = AREA_COORDS[a.area] || { x: 50, y: 50 };
    const coordB = AREA_COORDS[b.area] || { x: 50, y: 50 };
    return coordA.x - coordB.x;
  });

  let current = remaining.shift();
  sorted.push(current);

  while (remaining.length > 0) {
    let closestIndex = 0;
    let minDistance = Infinity;
    const currentCoord = AREA_COORDS[current.area] || { x: 50, y: 50 };

    for (let i = 0; i < remaining.length; i++) {
      const targetCoord = AREA_COORDS[remaining[i].area] || { x: 50, y: 50 };
      const dist = Math.pow(currentCoord.x - targetCoord.x, 2) + Math.pow(currentCoord.y - targetCoord.y, 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    current = remaining.splice(closestIndex, 1)[0];
    sorted.push(current);
  }

  return sorted;
}

// --- RENDER RESULT VIEW ---
function renderCourseResult() {
  const course = state.currentCourse;
  if (!course) return;

  // Title & Metadata
  document.getElementById("result-course-title").textContent = course.title;
  document.getElementById("result-meta-time").textContent = course.duration + "시간";
  document.getElementById("result-meta-budget").textContent = course.budget.toLocaleString() + "원";
  document.getElementById("result-meta-score").textContent = course.matchScore + "%";

  const descriptionElement = document.getElementById("result-course-desc");
  const areasUsed = [...new Set(course.spots.map(s => s.area))].join("와 ");
  descriptionElement.textContent = `종로의 ${areasUsed} 일대를 혼자 조용히 산책하며 취향을 만끽할 수 있는 최적의 동선입니다.`;

  // Draw Map Route SVG
  drawRouteMap(course.spots);

  // Populate Timeline spots
  const timelineContainer = document.getElementById("course-timeline");
  timelineContainer.innerHTML = "";

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  course.spots.forEach((spot, index) => {
    const isFav = favorites.includes(spot.id);
    const itemDiv = document.createElement("div");
    itemDiv.className = "timeline-item";
    
    // Map categories to emoji badges
    let badgeEmoji = "📍";
    let colorClass = "popup";
    if (spot.category === "restaurant") { badgeEmoji = "🍲"; colorClass = "restaurant"; }
    else if (spot.category === "cafe") { badgeEmoji = "☕"; colorClass = "cafe"; }
    else if (spot.category === "popup") { badgeEmoji = "🏛️"; colorClass = "popup"; }
    else if (spot.category === "shop") { badgeEmoji = "🛍️"; colorClass = "shop"; }

    itemDiv.innerHTML = `
      <div class="timeline-badge ${colorClass}">${badgeEmoji}</div>
      <div class="spot-card">
        <div class="spot-img-container">
          <img src="${spot.image}" alt="${spot.name}" class="spot-img" onerror="this.src='assets/jongno_landing.png'">
          <span class="spot-tag-category">${spot.subCategory}</span>
        </div>
        <div class="spot-content">
          <div class="spot-header">
            <h4 class="serif-title spot-name">${index + 1}. ${spot.name}</h4>
            <button class="spot-fav-btn ${isFav ? 'active' : ''}" data-spot-id="${spot.id}">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="spot-meta">⏱️ 예상 소요: ${spot.duration}시간 | 📍 위치: ${spot.area} | 💰 예산: ${spot.budget.toLocaleString()}원</div>
          <p class="spot-desc">${spot.description}</p>
          <div class="spot-solo-reason">
            <strong>💡 혼자 가기 좋은 이유:</strong><br>${spot.soloReason}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="spot-tags">
              ${spot.tags.map(t => `<span class="spot-tag">#${t}</span>`).join('')}
            </div>
            <a href="${spot.mapUrl}" target="_blank" class="map-link-btn" style="position: static; margin-top: 0; padding: 4px 8px;">
              <span>길찾기</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Bind favorite heart click
    itemDiv.querySelector(".spot-fav-btn").addEventListener("click", (e) => {
      toggleFavorite(spot.id, e.currentTarget);
    });

    timelineContainer.appendChild(itemDiv);
  });

  // Setup general Kakao route search button
  const searchQueries = course.spots.map(s => s.name).join(" -> ");
  document.getElementById("btn-open-map-app").onclick = () => {
    const kakaoMapSearchUrl = `https://map.kakao.com/?sName=${encodeURIComponent(course.spots[0].name)}&eName=${encodeURIComponent(course.spots[course.spots.length-1].name)}`;
    window.open(kakaoMapSearchUrl, "_blank");
  };
}

// Generate animated SVG route mapping
function drawRouteMap(spots) {
  const container = document.getElementById("route-svg-container");
  container.innerHTML = "";

  const width = 400;
  const height = 120;
  const padding = 35;
  const nodeCount = spots.length;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "route-svg");

  // Calculate standard spacing points along a linear route line
  const points = [];
  for (let i = 0; i < nodeCount; i++) {
    const x = padding + (i / (nodeCount - 1)) * (width - 2 * padding);
    // Draw wavy river path
    const y = height / 2 + Math.sin(i * 1.5) * 15;
    points.push({ x, y });
  }

  // Draw traditional grid pattern in SVG background
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
  pattern.setAttribute("id", "grid");
  pattern.setAttribute("width", "10");
  pattern.setAttribute("height", "10");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  
  const pathPattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathPattern.setAttribute("d", "M 10 0 L 0 0 0 10");
  pathPattern.setAttribute("fill", "none");
  pathPattern.setAttribute("stroke", "rgba(139,94,60,0.05)");
  pathPattern.setAttribute("stroke-width", "0.5");
  
  pattern.appendChild(pathPattern);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("fill", "url(#grid)");
  svg.appendChild(rect);

  // Draw connecting dashed line
  if (points.length > 1) {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Draw curved connectors
      const xc = (points[i-1].x + points[i].x) / 2;
      const yc = (points[i-1].y + points[i].y) / 2;
      d += ` Q ${points[i-1].x + 30} ${points[i-1].y + (i%2===0?15:-15)}, ${points[i].x} ${points[i].y}`;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#3A5A40");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-dasharray", "6 4");
    svg.appendChild(path);
  }

  // Draw place nodes
  points.forEach((pt, index) => {
    const spot = spots[index];

    // Node Circle Outer glow
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    glow.setAttribute("cx", pt.x);
    glow.setAttribute("cy", pt.y);
    glow.setAttribute("r", "16");
    glow.setAttribute("fill", "rgba(212, 163, 115, 0.15)");
    svg.appendChild(glow);

    // Node Circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pt.x);
    circle.setAttribute("cy", pt.y);
    circle.setAttribute("r", "12");
    circle.setAttribute("fill", "#3A5A40");
    circle.setAttribute("stroke", "#FAF7F2");
    circle.setAttribute("stroke-width", "2");
    svg.appendChild(circle);

    // Node Number text
    const textNum = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textNum.setAttribute("x", pt.x);
    textNum.setAttribute("y", pt.y + 4);
    textNum.setAttribute("fill", "#FFF");
    textNum.setAttribute("font-size", "10");
    textNum.setAttribute("font-weight", "bold");
    textNum.setAttribute("text-anchor", "middle");
    textNum.textContent = index + 1;
    svg.appendChild(textNum);

    // Area Label text underneath
    const textLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textLabel.setAttribute("x", pt.x);
    textLabel.setAttribute("y", pt.y + 30);
    textLabel.setAttribute("fill", "#8B5E3C");
    textLabel.setAttribute("font-size", "10");
    textLabel.setAttribute("font-family", "Gowun Batang");
    textLabel.setAttribute("font-weight", "bold");
    textLabel.setAttribute("text-anchor", "middle");
    textLabel.textContent = spot.name.split(" ")[0].substr(0, 5); // Short name
    svg.appendChild(textLabel);
  });

  container.appendChild(svg);
}

// Toggle Favorites
function toggleFavorite(spotId, btnEl) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const idx = favorites.indexOf(spotId);
  
  if (idx > -1) {
    favorites.splice(idx, 1);
    btnEl.classList.remove("active");
    btnEl.innerHTML = "🤍";
    showToast("즐겨찾기에서 해제되었습니다.");
  } else {
    favorites.push(spotId);
    btnEl.classList.add("active");
    btnEl.innerHTML = "❤️";
    showToast("즐겨찾기에 등록되었습니다.");
  }
  
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// --- SAVE & SHARE LOGIC ---
function saveCurrentCourse() {
  if (!state.currentCourse) return;
  if (!state.user) {
    showToast("로그인이 필요합니다.");
    showView("view-auth");
    return;
  }

  const savedCourses = JSON.parse(localStorage.getItem("savedCourses")) || [];
  
  // Check if course already saved
  const alreadySaved = savedCourses.find(c => c.id === state.currentCourse.id || c.title === state.currentCourse.title);
  if (alreadySaved) {
    showToast("이미 저장된 코스입니다.");
    return;
  }

  const courseToSave = {
    ...state.currentCourse,
    userId: state.user.id,
    savedAt: new Date().toLocaleDateString()
  };

  savedCourses.push(courseToSave);
  localStorage.setItem("savedCourses", JSON.stringify(savedCourses));
  showToast("마이페이지에 코스가 저장되었습니다!");
}

function shareCurrentCourse() {
  if (!state.currentCourse) return;

  const sharedCourses = JSON.parse(localStorage.getItem("sharedCourses")) || [];
  const shareId = "share_" + Math.random().toString(36).substr(2, 7);

  sharedCourses.push({
    id: shareId,
    course: state.currentCourse
  });
  localStorage.setItem("sharedCourses", JSON.stringify(sharedCourses));

  const shareUrl = `${window.location.origin}${window.location.pathname}#share-${shareId}`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast("공유 링크가 클립보드에 복사되었습니다!");
  }).catch(() => {
    alert(`공유 링크: ${shareUrl}`);
  });
}

// Check for shared courses hashes on load
function checkShareLink() {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#share-")) {
    const shareId = hash.replace("#share-", "");
    const sharedCourses = JSON.parse(localStorage.getItem("sharedCourses")) || [];
    const matched = sharedCourses.find(sc => sc.id === shareId);

    if (matched) {
      state.currentCourse = matched.course;
      state.user = { id: "shared_guest", isMember: false, age: "20", gender: "female", nationality: "korean" };
      showToast("공유된 여행 코스를 로드했습니다.");
      
      // Delay slightly for rendering
      setTimeout(() => {
        renderCourseResult();
        showView("view-result");
      }, 300);
    }
  }
}

// --- REVIEW & FEEDBACK SYSTEM ---
function openReviewModal() {
  const course = state.currentCourse;
  if (!course) return;

  // Clear inputs
  document.querySelector('.rating-stars[data-target="course"]').dataset.rating = "0";
  document.querySelectorAll('.rating-stars[data-target="course"] .star').forEach(s => s.classList.remove("active"));
  document.getElementById("course-comment").value = "";
  
  document.querySelectorAll("#accuracy-feedback-group .feedback-btn").forEach(b => b.classList.remove("active"));

  // Build Spot review forms dynamically
  const spotListEl = document.getElementById("modal-spots-review-list");
  spotListEl.innerHTML = "";

  course.spots.forEach(spot => {
    const row = document.createElement("div");
    row.className = "review-spot-row";
    row.innerHTML = `
      <div style="font-weight: bold; font-size: 0.9rem; color: var(--accent-wood); margin-bottom: 6px;">${spot.name}</div>
      <div class="rating-stars" data-spot-id="${spot.id}">
        <span class="star" data-value="1">★</span>
        <span class="star" data-value="2">★</span>
        <span class="star" data-value="3">★</span>
        <span class="star" data-value="4">★</span>
        <span class="star" data-value="5">★</span>
      </div>
      <input type="text" class="form-control spot-comment-input" data-spot-id="${spot.id}" placeholder="이 장소에 대한 후기를 적어주세요.">
    `;

    // Bind clicks to dynamically added stars
    row.querySelectorAll(".star").forEach(star => {
      star.addEventListener("click", (e) => {
        const container = e.target.parentElement;
        const val = parseInt(e.target.dataset.value);
        container.dataset.rating = val;
        
        container.querySelectorAll(".star").forEach(s => {
          const starVal = parseInt(s.dataset.value);
          s.classList.toggle("active", starVal <= val);
        });
      });
    });

    spotListEl.appendChild(row);
  });

  document.getElementById("modal-review").classList.add("active");
}

function closeReviewModal() {
  document.getElementById("modal-review").classList.remove("active");
}

function submitReviewFeedback() {
  const course = state.currentCourse;
  if (!course) return;

  const courseRating = parseInt(document.querySelector('.rating-stars[data-target="course"]').dataset.rating) || 0;
  const courseComment = document.getElementById("course-comment").value.trim();

  if (courseRating === 0) {
    showToast("코스 전체 별점을 매겨주세요.");
    return;
  }

  // Get Accuracy Feedback
  const activeAccuracyBtn = document.querySelector("#accuracy-feedback-group .feedback-btn.active");
  const accuracyFeedback = activeAccuracyBtn ? activeAccuracyBtn.dataset.accuracy : "normal";

  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];

  // Parse spot ratings
  const spotReviews = [];
  let allSpotsRated = true;

  course.spots.forEach(spot => {
    const starContainer = document.querySelector(`.rating-stars[data-spot-id="${spot.id}"]`);
    const rating = parseInt(starContainer.dataset.rating) || 0;
    const comment = document.querySelector(`.spot-comment-input[data-spot-id="${spot.id}"]`).value.trim();

    if (rating === 0) {
      allSpotsRated = false;
    }

    spotReviews.push({
      spotId: spot.id,
      spotName: spot.name,
      rating,
      comment
    });
  });

  if (!allSpotsRated) {
    showToast("모든 방문 장소의 별점을 작성해 주세요.");
    return;
  }

  // Save to reviews list
  const fullReview = {
    reviewId: "rev_" + Date.now(),
    userId: state.user ? state.user.id : "guest",
    courseId: course.id,
    courseTitle: course.title,
    courseRating,
    courseComment,
    accuracyFeedback,
    spotReviews,
    submittedAt: new Date().toLocaleDateString()
  };

  reviews.push(fullReview);
  localStorage.setItem("reviews", JSON.stringify(reviews));

  showToast("소중한 리뷰와 피드백이 등록되었습니다! 감사합니다.");
  closeReviewModal();

  // Route back to My Page to see review
  renderMyPage();
  showView("view-mypage");
}

// --- MY PAGE RENDERING ---
let currentMyTab = "courses";

function renderMyPage() {
  // Username title
  const usernameEl = document.getElementById("mypage-username");
  const infoEl = document.getElementById("mypage-user-info");
  
  if (state.user) {
    usernameEl.textContent = state.user.isMember ? `${state.user.id} 님` : "비회원 여행자 님";
    
    let ageK = state.user.age === "20" ? "20대" : (state.user.age === "30" ? "30대" : "40대 이상");
    let genderK = state.user.gender === "female" ? "여성" : (state.user.gender === "male" ? "남성" : "미선택");
    let natK = state.user.nationality === "korean" ? "내국인" : "외국인";
    
    infoEl.textContent = `${ageK} · ${genderK} · ${natK}`;
  } else {
    usernameEl.textContent = "방문객 님";
    infoEl.textContent = "로그인 정보가 없습니다.";
  }

  switchMyPageTab(currentMyTab);
}

function switchMyPageTab(tabName) {
  currentMyTab = tabName;
  document.querySelectorAll(".mypage-menu-tab").forEach(tab => {
    tab.classList.toggle("active", tab.id === `mytab-${tabName}`);
  });

  const contentContainer = document.getElementById("mypage-tab-content");
  contentContainer.innerHTML = "";

  const userId = state.user ? state.user.id : "guest";

  if (tabName === "courses") {
    // Render Saved Courses
    const savedCourses = JSON.parse(localStorage.getItem("savedCourses")) || [];
    const myCourses = savedCourses.filter(c => c.userId === userId);

    if (myCourses.length === 0) {
      contentContainer.innerHTML = `<div class="no-data-msg">🌿 아직 저장된 추천 코스가 없습니다.<br>나만의 맞춤 코스를 추천받아 보세요!</div>`;
      return;
    }

    const listDiv = document.createElement("div");
    listDiv.className = "saved-courses-list";

    myCourses.forEach(course => {
      const card = document.createElement("div");
      card.className = "saved-course-card";
      
      const spotNames = course.spots.map(s => s.name).join(" ➔ ");

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <h4 class="serif-title saved-course-title">${course.title}</h4>
          <span style="font-size: 0.7rem; color: var(--text-muted);">${course.savedAt}</span>
        </div>
        <p class="saved-course-spots">${spotNames}</p>
        <div style="font-size: 0.75rem; color: var(--primary-green); margin-top: 8px; font-weight: bold;">
          ⏱️ ${course.duration}시간 | 💰 ${course.budget.toLocaleString()}원
        </div>
      `;

      card.addEventListener("click", () => {
        state.currentCourse = course;
        renderCourseResult();
        showView("view-result");
      });

      listDiv.appendChild(card);
    });

    contentContainer.appendChild(listDiv);

  } else if (tabName === "favorites") {
    // Render Favorite Places
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const favoriteSpots = JONGNO_SPOTS.filter(s => favorites.includes(s.id));

    if (favoriteSpots.length === 0) {
      contentContainer.innerHTML = `<div class="no-data-msg">❤️ 마음에 드는 장소를 하트 표시해 즐겨찾기에 추가해 보세요!</div>`;
      return;
    }

    const listDiv = document.createElement("div");
    listDiv.className = "saved-courses-list";

    favoriteSpots.forEach(spot => {
      const card = document.createElement("div");
      card.className = "saved-course-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 class="serif-title saved-course-title">${spot.name}</h4>
          <button class="spot-fav-btn active" style="font-size: 1rem;">❤️</button>
        </div>
        <p class="saved-course-spots">${spot.subCategory} | 📍 ${spot.area}</p>
        <p style="font-size: 0.75rem; margin-top: 6px; color: var(--text-muted);">${spot.description}</p>
      `;

      // Unfavorite trigger
      card.querySelector(".spot-fav-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(spot.id, e.currentTarget);
        renderMyPage(); // Rerender tab
      });

      card.addEventListener("click", () => {
        window.open(spot.mapUrl, "_blank");
      });

      listDiv.appendChild(card);
    });

    contentContainer.appendChild(listDiv);

  } else if (tabName === "reviews") {
    // Render Reviews
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    const myReviews = reviews.filter(r => r.userId === userId);

    if (myReviews.length === 0) {
      contentContainer.innerHTML = `<div class="no-data-msg">✍️ 여행 후 남기신 소중한 후기들이 여기에 표시됩니다.</div>`;
      return;
    }

    myReviews.forEach(rev => {
      const revDiv = document.createElement("div");
      revDiv.className = "review-item";
      
      const starsString = "★".repeat(rev.courseRating) + "☆".repeat(5 - rev.courseRating);

      revDiv.innerHTML = `
        <div class="review-meta">
          <span style="font-weight: bold; color: var(--accent-wood);">${rev.courseTitle}</span>
          <span>${rev.submittedAt}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span class="review-stars">${starsString}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 6px;">정확도 피드백: ${rev.accuracyFeedback === 'good' ? '만족' : (rev.accuracyFeedback === 'normal' ? '보통' : '아쉬움')}</span>
        </div>
        <p class="review-text"><strong>코스 평:</strong> ${rev.courseComment || "후기 없음"}</p>
        <div style="margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
          ${rev.spotReviews.map(sr => `
            <div style="font-size: 0.75rem; margin-bottom: 4px;">
              <strong>${sr.spotName}</strong>: <span class="review-stars">${"★".repeat(sr.rating)}${"☆".repeat(5-sr.rating)}</span> ${sr.comment ? `<br><span style="color:var(--text-muted);">${sr.comment}</span>` : ""}
            </div>
          `).join('')}
        </div>
      `;

      contentContainer.appendChild(revDiv);
    });
  }
}

// --- CONSOLE DIAGNOSTIC TOOL ---
window.runDiagnostics = function() {
  console.log("=== JONGNO_SOLO DIAGNOSTIC SUITE ===");
  console.log(`Loaded spots count: ${JONGNO_SPOTS.length}`);
  const categories = JONGNO_SPOTS.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});
  console.log("Category counts:", categories);
  
  const areas = JONGNO_SPOTS.reduce((acc, s) => {
    acc[s.area] = (acc[s.area] || 0) + 1;
    return acc;
  }, {});
  console.log("Area counts:", areas);
  
  console.log("Current user session status:", state.user);
  console.log("Current survey answers settings:", state.surveyAnswers);
  console.log("====================================");
  return "Diagnostics Completed.";
};
