import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Upload, Download, Eye, FileText, File, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { useData, mockDocuments } from "@/contexts/data-context";
import { DocumentType } from "@/types";
import { PageContainer } from "@/components/layout/page-container";

export function DocumentsList() {
  const { getClientById, getOpportunityById } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  
  const navigate = useNavigate();

  const filteredDocuments = mockDocuments.filter(document => {
    const client = document.clientId ? getClientById(document.clientId) : null;
    const opportunity = document.opportunityId ? getOpportunityById(document.opportunityId) : null;
    
    const matchesSearch = 
      document.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity?.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || document.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case 'contract':
        return 'bg-opp-bg-buy text-opportunity-buy';
      case 'id':
        return 'bg-tier-info-bg text-tier-info';
      case 'financial':
        return 'bg-tier-neutral-bg text-tier-neutral';
      case 'property':
        return 'bg-opp-bg-sell text-opportunity-sell';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeCounts = () => {
    return {
      all: mockDocuments.length,
      contract: mockDocuments.filter(d => d.type === 'contract').length,
      id: mockDocuments.filter(d => d.type === 'id').length,
      financial: mockDocuments.filter(d => d.type === 'financial').length,
      property: mockDocuments.filter(d => d.type === 'property').length,
      other: mockDocuments.filter(d => d.type === 'other').length,
    };
  };

  const typeCounts = getTypeCounts();

  return (
    <PageContainer>
      {/* Invisible tracking sentinel for global header */}
      <TrackedTitle title="Documents">
        <div className="h-px w-full" aria-hidden="true" />
      </TrackedTitle>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold">Documents</h1>
            <p className="text-muted-foreground">Manage client and property documents</p>
          </div>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">{typeCounts.all}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-opportunity-buy">{typeCounts.contract}</div>
            <div className="text-sm text-muted-foreground">Contracts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-verified">{typeCounts.id}</div>
            <div className="text-sm text-muted-foreground">ID Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-tier-neutral">{typeCounts.financial}</div>
            <div className="text-sm text-muted-foreground">Financial</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-opportunity-sell">{typeCounts.property}</div>
            <div className="text-sm text-muted-foreground">Property</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-muted-foreground">{typeCounts.other}</div>
            <div className="text-sm text-muted-foreground">Other</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search documents, clients, or opportunities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Type: {typeFilter === 'all' ? 'All' : typeFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTypeFilter('all')}>All Types</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('contract')}>Contract</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('id')}>ID</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('financial')}>Financial</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('property')}>Property</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('other')}>Other</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((document) => {
              const client = document.clientId ? getClientById(document.clientId) : null;
              const opportunity = document.opportunityId ? getOpportunityById(document.opportunityId) : null;
              
              return (
                <TableRow 
                  key={document.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(document.mimeType)}
                      <div>
                        <span className="font-medium">{document.name}</span>
                        <p className="text-xs text-muted-foreground">{document.mimeType}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(document.type)}`}>
                      {document.type}
                    </span>
                  </TableCell>
                  <TableCell>{formatFileSize(document.size)}</TableCell>
                  <TableCell>
                    {client ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar name={client.fullName} size="sm" />
                        <span className="text-sm">{client.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {opportunity ? (
                      <StatusBadge variant="tag" className="text-xs">
                        {opportunity.title}
                      </StatusBadge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(document.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No documents found matching your criteria</p>
        </div>
      )}
      </div>
    </PageContainer>
  );
}