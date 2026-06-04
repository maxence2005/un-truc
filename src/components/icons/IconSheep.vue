<template>
<svg viewBox="0 0 32 32" width="50" height="50" xmlns="http://www.w3.org/2000/svg" class="retro-icon">
  <!-- Glitch layers -->
  <g class="glitch-red" opacity="0.5">
    <rect x="7" y="10" width="18" height="12" fill="#ff003c" />
    <rect x="23" y="12" width="6" height="6" fill="#ff003c" />
  </g>
  <g class="glitch-cyan" opacity="0.5">
    <rect x="5" y="10" width="18" height="12" fill="#00eaff" />
    <rect x="21" y="12" width="6" height="6" fill="#00eaff" />
  </g>

  <!-- Main Sheep Body -->
  <rect x="6" y="10" width="18" height="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  
  <!-- Head -->
  <rect x="22" y="12" width="6" height="6" fill="#ffffff" stroke="#000000" stroke-width="1" />
  
  <!-- Ears/Features -->
  <rect x="22" y="11" width="2" height="2" fill="#000000" />
  <rect x="27" y="11" width="2" height="2" fill="#000000" />
  
  <!-- Eyes -->
  <rect x="24" y="14" width="1" height="1" fill="#000000" />
  <rect x="26" y="14" width="1" height="1" fill="#000000" />
  
  <!-- Legs -->
  <rect x="8" y="22" width="2" height="3" fill="#000000" />
  <rect x="12" y="22" width="2" height="3" fill="#000000" />
  <rect x="18" y="22" width="2" height="3" fill="#000000" />
  <rect x="22" y="22" width="2" height="3" fill="#000000" />

  <!-- Wool detail -->
  <rect x="9" y="13" width="2" height="2" fill="#ece9e0" />
  <rect x="15" y="16" width="2" height="2" fill="#ece9e0" />
</svg>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;

.retro-icon {
  transition: transform 0.1s;
  cursor: pointer;
  filter: drop-shadow(2px 2px 0px $black);

  &:hover {
    transform: scale(1.1) translate(-2px, -2px);
    
    .glitch-red {
      animation: glitch-anim-1 0.2s infinite;
    }
    .glitch-cyan {
      animation: glitch-anim-2 0.2s infinite;
    }
  }
}

@keyframes glitch-anim-1 {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(-1px, -1px); }
  60% { transform: translate(2px, 1px); }
  80% { transform: translate(1px, -2px); }
  100% { transform: translate(0); }
}

@keyframes glitch-anim-2 {
  0% { transform: translate(0); }
  20% { transform: translate(2px, -1px); }
  40% { transform: translate(1px, 1px); }
  60% { transform: translate(-2px, -1px); }
  80% { transform: translate(-1px, 2px); }
  100% { transform: translate(0); }
}
</style>