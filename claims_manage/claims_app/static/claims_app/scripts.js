function listApp() {
    return {
    list: [],
    loading: true,
    async fetchList() {
        const res = await fetch("/api/list/");
        this.list = await res.json();
        this.loading = false;
        }
    }
}