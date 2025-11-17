const createThemeSlice = (set) =>({
    theme:"dark",
    setTheme : (theme) => set({theme})
})
export default createThemeSlice