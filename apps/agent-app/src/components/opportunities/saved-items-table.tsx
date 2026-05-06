import { useState } from "react";
import { MoreVertical, Share2, Phone, MessageSquare, Mail, User, Handshake, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatePresence, motion } from "framer-motion";
import { OpportunityType } from "@/types";

// === PROPERTIES TABLE ===

interface SavedPropertyRow {
  id: string;
  image: string;
  title: string;
  location?: string;
  price: number;
  originalPrice?: number;
  bedrooms: number;
  bathrooms?: number;
  size: number;
  sizeUnit: string;
  badges?: string[];
  createdAt?: string;
  portalInquired?: { portal: string; timestamp: string };
  propertySaved?: { timestamp: string };
  agentName?: string;
  isOwnProperty?: boolean;
}

interface SavedPropertiesTableProps {
  properties: SavedPropertyRow[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onShareProperty: (prop: SavedPropertyRow) => void;
  onBookVisit: () => void;
  onCall: (prop: SavedPropertyRow) => void;
  onWhatsApp: (prop: SavedPropertyRow) => void;
  onEmail: (prop: SavedPropertyRow) => void;
  onGoToProfile?: (prop: SavedPropertyRow) => void;
  onCloseDeal: () => void;
  onRemove: (id: string, title: string) => void;
  onClick: (prop: SavedPropertyRow) => void;
}

export function SavedPropertiesTable({
  properties,
  selectedIds,
  onSelectionChange,
  onShareProperty,
  onBookVisit,
  onCall,
  onWhatsApp,
  onEmail,
  onGoToProfile,
  onCloseDeal,
  onRemove,
  onClick,
}: SavedPropertiesTableProps) {
  const allSelected = properties.length > 0 && selectedIds.size === properties.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < properties.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(properties.map(p => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const formatPrice = (price: number) => `€${price.toLocaleString('es-ES')}`;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
                className={cn(someSelected && "data-[state=unchecked]:bg-muted")}
                ref={(el) => {
                  if (el) {
                    const input = el.querySelector('button');
                    if (input) input.dataset.indeterminate = someSelected ? 'true' : 'false';
                  }
                }}
              />
            </TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {properties.map((prop) => (
              <motion.tr
                key={prop.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
                className={cn(
                  "border-b last:border-b-0 transition-colors",
                  selectedIds.has(prop.id) ? "bg-muted/50" : "hover:bg-muted/30"
                )}
              >
                <TableCell className="w-12">
                  <Checkbox
                    checked={selectedIds.has(prop.id)}
                    onCheckedChange={() => toggleOne(prop.id)}
                    aria-label={`Select ${prop.title}`}
                  />
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onClick(prop)}
                  >
                    <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{prop.title}</p>
                      {prop.location && (
                        <p className="text-xs text-muted-foreground truncate">{prop.location}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{formatPrice(prop.price)}</span>
                    {prop.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(prop.originalPrice)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {prop.bedrooms} bed{prop.bedrooms !== 1 ? 's' : ''} · {prop.size} {prop.sizeUnit}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {prop.badges?.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs w-fit">
                        {badge}
                      </Badge>
                    ))}
                    {prop.portalInquired && (
                      <span className="text-xs text-muted-foreground">
                        via {prop.portalInquired.portal} · {prop.portalInquired.timestamp}
                      </span>
                    )}
                    {prop.propertySaved && (
                      <span className="text-xs text-muted-foreground">
                        Saved {prop.propertySaved.timestamp}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => onShareProperty(prop)} className="gap-2">
                          <Share2 className="w-4 h-4" /> Share property
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onBookVisit} className="gap-2">
                          <Calendar className="w-4 h-4" /> Book visit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="gap-2">
                            <Phone className="w-4 h-4" /> Contact {prop.isOwnProperty ? 'client' : 'agent'}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => onCall(prop)} className="gap-2">
                              <Phone className="w-4 h-4" /> Call
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onWhatsApp(prop)} className="gap-2">
                              <MessageSquare className="w-4 h-4" /> WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEmail(prop)} className="gap-2">
                              <Mail className="w-4 h-4" /> Email
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        {onGoToProfile && prop.isOwnProperty && (
                          <DropdownMenuItem onClick={() => onGoToProfile(prop)} className="gap-2">
                            <User className="w-4 h-4" /> Go to profile
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onCloseDeal} className="gap-2">
                          <Handshake className="w-4 h-4" /> Close deal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRemove(prop.id, prop.title)} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}

// === BUYERS TABLE ===

interface SavedBuyerRow {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  location: string;
  budgetRange: string;
  bedrooms: string;
  size: string;
  portalInquired?: { portal: string; timestamp: string };
  buyerSaved?: { timestamp: string };
}

interface SavedBuyersTableProps {
  buyers: SavedBuyerRow[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  opportunityType: OpportunityType;
  onShareProperty: (buyer: SavedBuyerRow) => void;
  onBookVisit: () => void;
  onCall: (buyer: SavedBuyerRow) => void;
  onWhatsApp: (buyer: SavedBuyerRow) => void;
  onEmail: (buyer: SavedBuyerRow) => void;
  onGoToProfile: (buyer: SavedBuyerRow, index: number) => void;
  onCloseDeal: () => void;
  onRemove: (id: string, name: string) => void;
  onClick: (buyer: SavedBuyerRow, index: number) => void;
}

export function SavedBuyersTable({
  buyers,
  selectedIds,
  onSelectionChange,
  opportunityType,
  onShareProperty,
  onBookVisit,
  onCall,
  onWhatsApp,
  onEmail,
  onGoToProfile,
  onCloseDeal,
  onRemove,
  onClick,
}: SavedBuyersTableProps) {
  const allSelected = buyers.length > 0 && selectedIds.size === buyers.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < buyers.length;
  const itemLabel = opportunityType === 'lease' ? 'renter' : 'buyer';

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(buyers.map(b => b.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>{opportunityType === 'lease' ? 'Renter' : 'Buyer'}</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Preferences</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {buyers.map((buyer, index) => (
              <motion.tr
                key={buyer.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
                className={cn(
                  "border-b last:border-b-0 transition-colors",
                  selectedIds.has(buyer.id) ? "bg-muted/50" : "hover:bg-muted/30"
                )}
              >
                <TableCell className="w-12">
                  <Checkbox
                    checked={selectedIds.has(buyer.id)}
                    onCheckedChange={() => toggleOne(buyer.id)}
                    aria-label={`Select ${buyer.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onClick(buyer, index)}
                  >
                    <UserAvatar name={buyer.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{buyer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{buyer.location}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-semibold">{buyer.budgetRange}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {buyer.bedrooms} · {buyer.size}
                </TableCell>
                <TableCell>
                  {buyer.portalInquired && (
                    <span className="text-xs text-muted-foreground">
                      via {buyer.portalInquired.portal} · {buyer.portalInquired.timestamp}
                    </span>
                  )}
                  {buyer.buyerSaved && (
                    <span className="text-xs text-muted-foreground">
                      Saved {buyer.buyerSaved.timestamp}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => onShareProperty(buyer)} className="gap-2">
                          <Share2 className="w-4 h-4" /> Share property with {itemLabel}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onBookVisit} className="gap-2">
                          <Calendar className="w-4 h-4" /> Book visit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="gap-2">
                            <Phone className="w-4 h-4" /> Contact
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => onCall(buyer)} className="gap-2">
                              <Phone className="w-4 h-4" /> Call
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onWhatsApp(buyer)} className="gap-2">
                              <MessageSquare className="w-4 h-4" /> WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEmail(buyer)} className="gap-2">
                              <Mail className="w-4 h-4" /> Email
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => onGoToProfile(buyer, index)} className="gap-2">
                          <User className="w-4 h-4" /> Go to profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onCloseDeal} className="gap-2">
                          <Handshake className="w-4 h-4" /> Close deal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRemove(buyer.id, buyer.name)} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}

// === BULK ACTION BAR ===

interface BulkActionBarProps {
  count: number;
  itemLabel: string;
  onShare: () => void;
  onBookVisit: () => void;
  onRemove: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({ count, itemLabel, onShare, onBookVisit, onRemove, onClearSelection }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="fixed bottom-6 left-0 right-0 mx-auto w-fit z-50 flex items-center gap-3 bg-foreground text-background px-5 py-3 rounded-full shadow-lg"
    >
      <span className="text-sm font-semibold">
        {count} {itemLabel}{count !== 1 ? 's' : ''} selected
      </span>
      <div className="w-px h-5 bg-background/20" />
      <Button
        variant="ghost"
        size="sm"
        className="text-background hover:bg-background/10 hover:text-background rounded-full h-8 px-3 text-sm"
        onClick={onShare}
      >
        <Share2 className="w-3.5 h-3.5 mr-1.5" />
        Share
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-background hover:bg-background/10 hover:text-background rounded-full h-8 px-3 text-sm"
        onClick={onBookVisit}
      >
        <Calendar className="w-3.5 h-3.5 mr-1.5" />
        Book visit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-8 px-3 text-sm"
        onClick={onRemove}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        Remove
      </Button>
      <div className="w-px h-5 bg-background/20" />
      <Button
        variant="ghost"
        size="sm"
        className="text-background/60 hover:bg-background/10 hover:text-background rounded-full h-8 px-3 text-xs"
        onClick={onClearSelection}
      >
        Clear
      </Button>
    </motion.div>
  );
}
