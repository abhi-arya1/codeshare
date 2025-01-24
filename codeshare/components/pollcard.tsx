
import { X } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";


const Pollcard = ({ content, idx = -1, onClick, disabled=false }: { content: string, idx?: number, onClick: any, disabled: boolean }) => {
    return (
      <Card 
        onClick={onClick}
        className={cn(
            "relative p-3 text-lg group hover:bg-muted dark:hover:bg-muted hover:cursor-pointer dark:bg-[#1f1f1f] shadow-none w-full flex flex-col",
            disabled && "hover:cursor-not-allowed bg-muted hover:bg-muted dark:bg-muted"
        )}
      >
        {
            idx !== -1 && (
                <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-muted-foreground">Option {idx + 1}</span>
                </div>
            )
        }
        {content}
      </Card>
    );
  };

  

const PollcardTeacher = ({ content, idx = -1, handleDeleteItem }: { content: string, idx?: number, handleDeleteItem: any }) => {
    return (
      <Card className="relative p-3 text-lg group hover:bg-muted dark:bg-[#1f1f1f] shadow-none w-full flex flex-col">
        <div>
            <div className="absolute right-2 text-muted-foreground transition-opacity">
                <button className="rounded-lg transition-colors dark:text-white text-black hover:bg-destructive/40 bg-destructive/20 p-2" onClick={() => handleDeleteItem(idx)}>
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
        {
            idx !== -1 && (
                <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-muted-foreground">Option {idx + 1}</span>
                </div>
            )
        }
        {content}
      </Card>
    );
  };
  
  export default PollcardTeacher
  export { Pollcard }
  