function listApp() {
    return {
        list: [],
        loading: false,
        offset: 0,
        limit: 100,
        allLoaded: false,

        async fetchList() {
            if (this.loading || this.allLoaded) return;
            this.loading = true;

            const res = await fetch(`/api/list/?offset=${this.offset}&limit=${this.limit}`);
            const data = await res.json();

            if (data.results.length === 0) {
                this.allLoaded = true;
            } else {
                this.list.push(...data.results);
                this.offset += this.limit;
            }

            this.loading = false;
        }
    }
}
