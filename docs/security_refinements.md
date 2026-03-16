# Security Refinements & Architecture Polish

## Overview
Scrubbed and audited existing frontend paths for inadvertent security flaws along with routing misconfigurations. 

## Files Modified
*   **Frontend Wrapper**: `public/js/api.js`. Dismantled raw, hard-coded API base URLs pointing explicitly to `"http://localhost:3300"`. Set fallback to verify active Window Origin and resolve local hosts vs raw root directory pathways dynamically. This immediately shields production instances from inadvertently mapping to misconfigured endpoints.
