class MyObject {
    name: string

    /**
     * @ignore
     */
    _type: string

    set type(val: string) {
        this._type = val
    }

    get type(): string {
        return this._type
    }

    nameIsType() {
        return this._type === this.name
    }
}
