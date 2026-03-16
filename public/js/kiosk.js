document.addEventListener("DOMContentLoaded", () => {

  
  // --- Clock Logic ---
  const liveTime = document.getElementById("live-time");
  const liveDate = document.getElementById("live-date");

  const updateClock = () => {
    if (!liveTime || !liveDate) return;
    const now = new Date();
    liveTime.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    liveDate.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  updateClock();
  setInterval(updateClock, 1000);

  // --- Slider Logic ---
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.getElementById("prev-slide");
  const nextBtn = document.getElementById("next-slide");
  let currentSlide = 0;
  let slideInterval;

  const goToSlide = (index) => {
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove("active");
    if (dots[currentSlide]) dots[currentSlide].classList.remove("active");
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add("active");
    if (dots[currentSlide]) dots[currentSlide].classList.add("active");
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  if (slides.length > 0) {
    slideInterval = setInterval(nextSlide, 5000);

    if (nextBtn)
      nextBtn.addEventListener("click", () => {
        clearInterval(slideInterval);
        nextSlide();
        slideInterval = setInterval(nextSlide, 5000);
      });

    if (prevBtn)
      prevBtn.addEventListener("click", () => {
        clearInterval(slideInterval);
        prevSlide();
        slideInterval = setInterval(nextSlide, 5000);
      });

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        clearInterval(slideInterval);
        goToSlide(index);
        slideInterval = setInterval(nextSlide, 5000);
      });
    });
  }

  // --- Tab Logic ---
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const target = btn.dataset.target;
      document.getElementById(target).classList.add("active");
    });
  });

  // --- Inputs & Buttons ---
  const inputStudentId = document.getElementById("manual-student-id");
  const inputEmail = document.getElementById("manual-email");
  const inputPassword = document.getElementById("manual-password");
  const btnSubmitId = document.getElementById("btn-submit-id");
  const btnSubmitLogin = document.getElementById("btn-submit-login");

  // --- Modal Elements ---
  const resultModal = document.getElementById("result-modal");
  const btnModalClose = document.getElementById("btn-modal-close");
  const modalIcon = document.getElementById("modal-icon");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const modalDetails = document.getElementById("modal-details");

  // --- Purpose Modal Elements ---
  const purposeModal = document.getElementById("purpose-modal");
  const pmName = document.getElementById("pm-name");
  const pmStudentId = document.getElementById("pm-student-id");
  const pmRole = document.getElementById("pm-role");
  const pmDept = document.getElementById("pm-dept");
  const pmReason = document.getElementById("pm-reason");
  const pmOtherReason = document.getElementById("pm-other-reason");
  const btnPmConfirm = document.getElementById("btn-pm-confirm");
  const btnPmCancel = document.getElementById("btn-pm-cancel");

  // --- QR Elements ---
  const video = document.getElementById("qr-video");
  const canvasElement = document.getElementById("qr-canvas");
  const canvas = canvasElement.getContext("2d");

  // --- State Variables ---
  let pendingVerificationPayload = null;
  let pendingUserData = null; // Store user info for modal display
  let pmAutoSubmitTimer = null;
  let autoCloseTimer = null;
  let isProcessing = false;
  let lastPayloadAttempted = null;
  let currentActiveEvent = null; // Stores most recently seen active event name

  const showModal = (success, title, message, userDetails = null) => {
    isProcessing = true;

    if (success) {
      modalIcon.innerHTML = `<div style="width: 80px; height: 80px; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0.05); color: var(--accent);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>`;
    } else {
      modalIcon.innerHTML = `<div style="width: 80px; height: 80px; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0.05); color: #ef4444;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>`;
    }
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (userDetails) {
      document.getElementById("m-name").textContent =
        userDetails.name || "Unknown";
      document.getElementById("m-id").textContent = userDetails.id || "N/A";
      document.getElementById("m-dept").textContent =
        userDetails.department || "N/A";
      document.getElementById("m-purpose").textContent =
        userDetails.purpose || "Library Entry";
      document.getElementById("m-time").textContent =
        userDetails.time || new Date().toLocaleTimeString();

      const avatarDiv = document.getElementById("m-avatar");
      // Assuming we don't have profile pics yet, generate initials
      const nameStr = userDetails.name || "U";
      const nameParts = nameStr.trim().split(/\s+/);
      let initials = nameParts[0].charAt(0).toUpperCase();
      if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      }

      // Generate a consistent color based on initials
      const colors = [
        "#10b981",
        "#3b82f6",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#ec4899",
      ];
      const charCodeSum =
        initials.charCodeAt(0) +
        (initials.length > 1 ? initials.charCodeAt(1) : 0);
      const bgColor = colors[charCodeSum % colors.length];

      if (userDetails.profileUrl) {
        avatarDiv.innerHTML = `<img src="${userDetails.profileUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        avatarDiv.style.background = "transparent";
        avatarDiv.style.boxShadow = `0 0 0 8px var(--bg-dark), 0 0 0 12px ${bgColor}`;
      } else {
        avatarDiv.innerHTML = initials;
        avatarDiv.style.background = bgColor;
        avatarDiv.style.boxShadow = `0 0 0 8px var(--bg-dark), 0 0 0 12px ${bgColor}`;
      }

      modalDetails.style.display = "flex";
    } else {
      modalDetails.style.display = "none";
    }

    resultModal.classList.add("show");

    let timeLeft = 10;
    if (autoCloseTimer) clearInterval(autoCloseTimer);
    const btnClose = document.getElementById("btn-modal-close");

    const tickTimer = () => {
      timeLeft--;
      if (timeLeft <= 0) {
        closeModal();
      } else {
        btnClose.textContent = `Close (${timeLeft}s)`;
      }
    };
    tickTimer(); // Call immediately
    autoCloseTimer = setInterval(tickTimer, 1000);
  };

  const closeModal = () => {
    resultModal.classList.remove("show");
    if (autoCloseTimer) clearInterval(autoCloseTimer);
    const btnClose = document.getElementById("btn-modal-close");
    if (btnClose) btnClose.textContent = "Close";

    setTimeout(() => {
      isProcessing = false;
      if (inputStudentId) inputStudentId.value = "";
      if (inputEmail) inputEmail.value = "";
      if (inputPassword) inputPassword.value = "";
    }, 300);
  };

  if (btnModalClose) btnModalClose.addEventListener("click", closeModal);

  // Allow clicking outside the modal to close it immediately
  resultModal.addEventListener("click", (e) => {
    if (e.target === resultModal) {
      closeModal();
    }
  });

  const closePurposeModal = () => {
    purposeModal.classList.remove("show");
    clearTimeout(pmAutoSubmitTimer);
    pendingVerificationPayload = null;
    // DO NOT set isProcessing = false here, because we are either finishing the login
    // or fully aborting. Let the success modal / abort sequence handle it.
  };

  // Helper function to show success modal (avoids code duplication)
  const showSuccessModal = (user, purpose) => {
    const userType = user.type || "student";
    const idLabel = userType === "staff" ? user.staff_id : user.id;
    let deptLabel;
    if (userType === "staff") {
      deptLabel = user.role || user.department || "N/A";
    } else {
      const college = user.college || "Unknown College";
      const section = user.section || "N/A";
      deptLabel = `(${college}) ${section}`;
    }

    showModal(true, "LOGGED SUCCESSFULLY", "Welcome to the NEU Library!", {
      name: user.name,
      id: (userType === "staff" ? "Staff: " : "Student: ") + idLabel,
      department: deptLabel,
      purpose: purpose,
      time: new Date().toLocaleTimeString(),
    });
  };

  const openPurposeModal = (user, payload, activeEventName = null) => {
    // Store user data for modal display
    pendingUserData = user;

    pmName.textContent = user.name;
    pmRole.textContent = user.type === "staff" ? "Staff" : "Student";
    pmStudentId.textContent = user.id;

    let deptLabel;
    if (user.type === "staff") {
      deptLabel = user.department;
    } else {
      const college = user.college || "Unknown College";
      const section = user.section || "N/A";
      deptLabel = `(${college}) ${section}`;
    }
    pmDept.textContent = deptLabel;

    // If there's an active event, skip the modal and auto-submit with event name as reason
    if (activeEventName) {
      pendingVerificationPayload = payload;
      closePurposeModal();
      isProcessing = false;
      showSuccessModal(user, activeEventName);
      return;
    }

    pmReason.value = "";
    pmOtherReason.value = "";
    pmOtherReason.style.display = "none";

    pendingVerificationPayload = payload;
    purposeModal.classList.add("show");

    // Auto-submit after 8 seconds if no action is taken
    pmAutoSubmitTimer = setTimeout(() => {
      if (pendingVerificationPayload && pendingUserData) {
        closePurposeModal();
        isProcessing = false;
        showSuccessModal(pendingUserData, "Library Entry");
      }
    }, 8000);
  };

  const lookupUser = async (payload) => {
    // Allow new scans to interrupt. Only block duplicate frames of the SAME code.
    if (
      isProcessing &&
      JSON.stringify(payload) === JSON.stringify(lastPayloadAttempted)
    ) {
      return; // Same code already in flight — ignore duplicate camera frame
    }

    lastPayloadAttempted = payload;

    // --- INSTANT OVERRIDE ---
    // If purpose modal is open, quietly log the previous user with default/event reason, then proceed.
    if (pendingVerificationPayload) {
      const prevPayload = { ...pendingVerificationPayload };
      closePurposeModal();
      isProcessing = false;
    }

    // If success modal is open, wipe it immediately.
    if (resultModal.classList.contains("show")) {
      closeModal();
    }

    isProcessing = true;

    try {
      if (btnSubmitId) btnSubmitId.disabled = true;
      if (btnSubmitLogin) btnSubmitLogin.disabled = true;

      const response = await fetch("/library/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const activeEventName = data.activeEvent || null;
        currentActiveEvent = activeEventName; // remember it globally for override path
        // Keep isProcessing = true while the purpose modal is open (or until auto-fire)
        openPurposeModal(data.user, payload, activeEventName);
      } else {
        isProcessing = false;
        showModal(
          false,
          "Access Denied",
          data.message || "Authorization failed.",
        );
      }
    } catch (err) {
      console.error(err);
      isProcessing = false;
      showModal(false, "System Error", "Could not reach server.");
    } finally {
      if (btnSubmitId) btnSubmitId.disabled = false;
      if (btnSubmitLogin) btnSubmitLogin.disabled = false;
    }
  };


  // --- Purpose Modal Listeners ---
  pmReason.addEventListener("change", () => {
    if (pmReason.value === "Others") {
      pmOtherReason.focus();
    } else {
      pmOtherReason.value = "";
    }
    // Resets the auto-submit if interacting
    clearTimeout(pmAutoSubmitTimer);
    pmAutoSubmitTimer = setTimeout(() => {
      if (pendingVerificationPayload && pendingUserData) {
        closePurposeModal();
        isProcessing = false;
        showSuccessModal(pendingUserData, "Library Entry");
      }
    }, 15000); // give them more time if they started interacting
  });

  pmOtherReason.addEventListener("focus", () => {
    pmReason.value = "Others";
    // Resets the auto-submit if interacting
    clearTimeout(pmAutoSubmitTimer);
    pmAutoSubmitTimer = setTimeout(() => {
      if (pendingVerificationPayload && pendingUserData) {
        closePurposeModal();
        isProcessing = false;
        showSuccessModal(pendingUserData, "Library Entry");
      }
    }, 15000);
  });

  btnPmConfirm.addEventListener("click", () => {
    if (!pendingVerificationPayload || !pendingUserData) return;

    let reason = pmReason.value;
    if (!reason) reason = "Library Entry";
    if (reason === "Others") {
      reason = pmOtherReason.value.trim() || "Library Entry";
    }

    closePurposeModal();
    isProcessing = false;
    showSuccessModal(pendingUserData, reason);
  });

  btnPmCancel.addEventListener("click", () => {
    closePurposeModal();
    isProcessing = false; // Reset lock because they fully aborted
  });

  if (btnSubmitId) {
    btnSubmitId.addEventListener("click", () => {
      const student_number = inputStudentId.value.trim();
      if (!student_number) return;
      lookupUser({ student_number });
    });

    if (inputStudentId) {
      inputStudentId.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnSubmitId.click();
      });
    }
  }

  if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener("click", () => {
      const email = inputEmail.value.trim();
      const password = inputPassword.value;
      if (!email || !password) return;
      // Now sends to purpose modal check like the others
      lookupUser({ email, password });
    });

    const loginEnterFn = (e) => {
      if (e.key === "Enter") btnSubmitLogin.click();
    };

    if (inputEmail) inputEmail.addEventListener("keydown", loginEnterFn);
    if (inputPassword) inputPassword.addEventListener("keydown", loginEnterFn);
  }

  // --- Scan Handler ---
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(function (stream) {
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        video.play();
        requestAnimationFrame(tick);
      })
      .catch(function (err) {
        console.error("Camera access error", err);
      });
  }

  function tick() {
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

      if (typeof jsQR !== "undefined") {
        const imageData = canvas.getImageData(
          0,
          0,
          canvasElement.width,
          canvasElement.height,
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        // Allow a new QR code to immediately override whatever is currently on the screen.
        if (code && code.data) {
          if (inputStudentId) {
            inputStudentId.value = code.data;
          }
          lookupUser({ qr_code: code.data });
        }
      }
    }
    requestAnimationFrame(tick);
  }
});
