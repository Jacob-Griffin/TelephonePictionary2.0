<script>
export default {
  data() {
    return {
      openModal: "",
    };
  },
  methods: {
    switchModal(event) {
      this.openModal = event?.target.getAttribute("modal") ?? "";
    },
    keyHandler(event) {
      if (event.key !== "Enter") return;
      const target = document.querySelector(".main-action");
      if (!target) return;

      target.click();
    },
  },
  beforeMount() {
    document.addEventListener("keydown", this.keyHandler);
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.keyHandler);
  },
};
</script>

<template>
  <main>
    <Logo></Logo>
    <div class="buttonMenu">
      <button @click="switchModal" modal="host">Host Game</button>
      <button @click="switchModal" modal="join">Join Game</button>
      <button @click="switchModal" modal="result">View Completed Games</button>
    </div>
    <HostModal
      v-if="openModal == 'host'"
      @modal-closed="switchModal"
    ></HostModal>
    <JoinModal
      v-if="openModal == 'join'"
      @modal-closed="switchModal"
    ></JoinModal>
    <ResultModal
      v-if="openModal == 'result'"
      @modal-closed="switchModal"
    ></ResultModal>
  </main>
  <BYFOFooter></BYFOFooter>
</template>

<style>
.buttonMenu {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 2rem;
  max-width: 768px;
  gap: 1rem;
}
</style>
