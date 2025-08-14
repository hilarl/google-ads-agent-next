// components/AccountSelection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Crown,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface GoogleAdsCustomer {
  resourceName: string;
  id: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  manager: boolean;
  testAccount: boolean;
  hierarchy?: GoogleAdsAccountHierarchy[];
}

export interface GoogleAdsAccountHierarchy {
  customerClient: GoogleAdsCustomer;
  level: number;
  manager: boolean;
  children: GoogleAdsAccountHierarchy[];
}

interface AccountSelectionProps {
  user: {
    email: string;
    name: string;
    picture: string;
  };
}

export default function AccountSelection({ user }: AccountSelectionProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<GoogleAdsCustomer[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [masterAccount, setMasterAccount] = useState<string>('');
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts);
      
      // Auto-select manager accounts and expand them
      const managerAccounts = data.accounts.filter((account: GoogleAdsCustomer) => account.manager);
      if (managerAccounts.length > 0) {
        setMasterAccount(managerAccounts[0].id);
        setExpandedManagers(new Set(managerAccounts.map((account: GoogleAdsCustomer) => account.id)));
      }
      
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to load your Google Ads accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const handleSelectAll = (accounts: GoogleAdsCustomer[]) => {
    const accountIds = accounts.map(account => account.id);
    const allSelected = accountIds.every(id => selectedAccounts.includes(id));
    
    if (allSelected) {
      setSelectedAccounts(prev => prev.filter(id => !accountIds.includes(id)));
    } else {
      setSelectedAccounts(prev => [...new Set([...prev, ...accountIds])]);
    }
  };

  const toggleManagerExpansion = (managerId: string) => {
    setExpandedManagers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerId)) {
        newSet.delete(managerId);
      } else {
        newSet.add(managerId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedAccounts.length === 0) {
      setError('Please select at least one account to continue.');
      return;
    }

    if (!masterAccount) {
      setError('Please select a master account.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/auth/select-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedAccounts,
          masterAccountId: masterAccount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to configure accounts');
      }

      // Redirect to main application
      router.push('/');
      
    } catch (error) {
      console.error('Error configuring accounts:', error);
      setError('Failed to configure accounts. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAccountCard = (account: GoogleAdsCustomer, level: number = 0) => (
    <div key={account.id} className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <Card className={`mb-3 ${selectedAccounts.includes(account.id) ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedAccounts.includes(account.id)}
                onCheckedChange={() => handleAccountToggle(account.id)}
              />
              
              <div className="flex items-center space-x-2">
                {account.manager ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleManagerExpansion(account.id)}
                    className="p-0 h-auto"
                  >
                    {expandedManagers.has(account.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-4" /> // Spacer for alignment
                )}
                
                {account.manager ? (
                  <Building2 className="h-5 w-5 text-blue-600" />
                ) : (
                  <Users className="h-5 w-5 text-green-600" />
                )}
              </div>
              
              <div>
                <div className="font-medium text-sm">{account.descriptiveName}</div>
                <div className="text-xs text-muted-foreground">
                  ID: {account.id} • {account.currencyCode} • {account.timeZone}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {account.manager && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Manager
                </Badge>
              )}
              
              {account.testAccount && (
                <Badge variant="outline" className="text-xs">
                  Test
                </Badge>
              )}
              
              {selectedAccounts.includes(account.id) && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Render hierarchy if manager account is expanded */}
      {account.manager && account.hierarchy && expandedManagers.has(account.id) && (
        <div className="ml-4 mb-4">
          {account.hierarchy.map(hierarchyNode => 
            renderAccountCard(hierarchyNode.customerClient, level + 1)
          )}
        </div>
      )}
    </div>
  );

  const managerAccounts = accounts.filter(account => account.manager);
  const clientAccounts = accounts.filter(account => !account.manager);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your Google Ads accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Select Google Ads Accounts</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose which accounts you&apos;d like to manage with our AI agent
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="text-right">
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Account Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Manager Accounts */}
          {managerAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  Manager Accounts
                </CardTitle>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Accounts that manage other Google Ads accounts
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(managerAccounts)}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ScrollArea className="max-h-96">
                  {managerAccounts.map(account => renderAccountCard(account))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Client Accounts */}
          {clientAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Client Accounts
                </CardTitle>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Individual advertising accounts
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(clientAccounts)}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ScrollArea className="max-h-96">
                  {clientAccounts.map(account => renderAccountCard(account))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Master Account Selection */}
        {selectedAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Master Account Selection</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose the primary account for authentication and cross-account operations
              </p>
            </CardHeader>
            <CardContent>
              <RadioGroup value={masterAccount} onValueChange={setMasterAccount}>
                <div className="grid md:grid-cols-2 gap-4">
                  {accounts
                    .filter(account => selectedAccounts.includes(account.id))
                    .map(account => (
                      <div key={account.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={account.id} id={account.id} />
                        <Label 
                          htmlFor={account.id}
                          className="flex items-center space-x-2 cursor-pointer flex-1"
                        >
                          {account.manager ? (
                            <Building2 className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Users className="h-4 w-4 text-green-600" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{account.descriptiveName}</div>
                            <div className="text-xs text-muted-foreground">
                              {account.id} • {account.currencyCode}
                            </div>
                          </div>
                          {account.manager && (
                            <Badge variant="secondary" className="text-xs ml-auto">
                              <Crown className="h-3 w-3 mr-1" />
                              Manager
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Selection Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{selectedAccounts.length}</div>
                <div className="text-sm text-muted-foreground">Selected Accounts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {accounts.filter(a => selectedAccounts.includes(a.id) && a.manager).length}
                </div>
                <div className="text-sm text-muted-foreground">Manager Accounts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {accounts.filter(a => selectedAccounts.includes(a.id) && !a.manager).length}
                </div>
                <div className="text-sm text-muted-foreground">Client Accounts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/auth/signin')}
            disabled={isSubmitting}
          >
            Back
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={selectedAccounts.length === 0 || !masterAccount || isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Configuring...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm">Manager Accounts</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Provide access to multiple client accounts and consolidated reporting. 
                    Recommended for agencies and businesses managing multiple campaigns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 text-sm">Client Accounts</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Individual advertising accounts that run campaigns. Select the specific 
                    accounts you want to analyze and optimize with AI.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}