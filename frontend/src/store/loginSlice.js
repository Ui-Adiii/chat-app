const createLoginSlice =(set) => ({
  step: 1,
  loginEmail: null,
  setStep: (step) => set({ step }),
  setEmailData: (data) => set({ loginEmail: data }),
  resetLoginState:()=>set({step:1,loginEmail:null})
});
export default createLoginSlice