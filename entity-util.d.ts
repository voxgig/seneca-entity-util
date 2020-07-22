interface DeriveSpec {
    fields: {
        [_: string]: (options: any, derive: DeriveSpec, msg: any, meta: any) => any;
    };
}
declare function entity_util(options: any): {
    name: string;
    export: {
        HIT: number;
        MISS: number;
        derive: any;
    };
};
declare const intern: {
    apply_duration: (out: any, meta: any, start: any, options: any) => void;
    apply_derive: (options: any, derive: DeriveSpec, msg: any, meta: any) => void;
};
