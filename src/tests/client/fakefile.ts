export class FakeFile implements File {
    readonly lastModifiedDate: any
    readonly name: string
    readonly webkitRelativePath: string
    readonly size: number
    readonly type: string
    private fileReader: FakeFileReader  | null
    constructor(fileReader: FakeFileReader | null = null) {
        this.fileReader = fileReader
    }
    msClose(): void {
        throw new Error("FakeFile: msClose is not mocked")
    }
    msDetachStream(): any {
        throw new Error("FakeFile: msDetachStream is not mocked")
    }
    slice(start?: number, end?: number, contentType?: string): Blob {
        throw new Error("FakeFile: slice is not mocked")
    }
    onload() {
        if (this.fileReader) {
            this.fileReader.onload(null)
        } else {
            throw new Error("FakeFile: onLoad is not mocked")
        }
    }
}

export class FakeFileReader {
    onload: (this: this, ev: any) => any
    readonly result: string
    constructor(result: string = "") {
        this.result = result
    }
    readAsText(blob: Blob, encoding?: string): void {
        throw new Error("FakeFile: readAsText is not mocked")
    }

}
