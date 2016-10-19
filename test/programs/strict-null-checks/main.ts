 
class MyObject {
     val: number;
     val_nullable: number | null;
     val_undef: number | undefined;
     val_opt?: number;

     val_true_opt?: true;
     val_true_or_null: true|null;
     val_true: true|true; // twice to check that it will appear only once
}
