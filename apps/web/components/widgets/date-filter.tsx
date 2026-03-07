"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

interface DateFilterProps {
  locale: string;
  currentFilters: {
    dateRange?: string;
    customDate?: string;
    sortOrder: 'desc' | 'asc';
  };
}

export function DateFilter({ currentFilters }: DateFilterProps) {
  const t = useTranslations("filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [dateRange, setDateRange] = useState(currentFilters.dateRange || 'all');
  const [customDate, setCustomDate] = useState(currentFilters.customDate || '');
  const [sortOrder, setSortOrder] = useState(currentFilters.sortOrder);
  const [showCustomDate, setShowCustomDate] = useState(currentFilters.dateRange === 'custom');
  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 when filters change
    params.set('page', '1');
    
    // Set filters
    if (dateRange === 'custom' && customDate) {
      params.set('customDate', customDate);
      params.delete('dateRange');
    } else if (dateRange !== 'all') {
      params.set('dateRange', dateRange);
      params.delete('customDate');
    } else {
      params.delete('dateRange');
      params.delete('customDate');
    }
    
    if (sortOrder !== 'desc') {
      params.set('sortOrder', sortOrder);
    } else {
      params.delete('sortOrder');
    }
    
    // Collapse the filter panel after applying
    setIsExpanded(false);
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setDateRange('all');
    setCustomDate('');
    setSortOrder('desc');
    setShowCustomDate(false);
    router.push(pathname);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setShowCustomDate(value === 'custom');
    if (value !== 'custom') {
      setCustomDate('');
    }
  };

  // Check if any filters are active
  const hasActiveFilters = dateRange !== 'all' || customDate || sortOrder !== 'desc';

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          className="rounded-none w-full md:w-auto flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>{t("filters")}</span>
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {t("active")}
              </span>
            )}
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Collapsible Filter Content */}
      {isExpanded && (
        <Card className="rounded-none">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">{t("filterByDate")}</Label>
                <RadioGroup value={dateRange} onValueChange={handleDateRangeChange}>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer font-normal">{t("allTime")}</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="7days" id="7days" />
                    <Label htmlFor="7days" className="cursor-pointer font-normal">{t("last7Days")}</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="30days" id="30days" />
                    <Label htmlFor="30days" className="cursor-pointer font-normal">{t("last30Days")}</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="3months" id="3months" />
                    <Label htmlFor="3months" className="cursor-pointer font-normal">{t("last3Months")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer font-normal">{t("customDate")}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Custom Date Picker or Sort Order */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {showCustomDate ? t("selectDate") : t("sortOrder")}
                </Label>
                {showCustomDate ? (
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="rounded-none"
                  />
                ) : (
                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">{t("newestFirst")}</SelectItem>
                      <SelectItem value="asc">{t("oldestFirst")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Sort Order (when custom date is shown) */}
              <div>
                {showCustomDate && (
                  <>
                    <Label className="text-sm font-semibold mb-3 block">{t("sortOrder")}</Label>
                    <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">{t("newestFirst")}</SelectItem>
                        <SelectItem value="asc">{t("oldestFirst")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-6">
              <Button onClick={applyFilters} className="rounded-none flex-1 md:flex-initial">
                {t("applyFilters")}
              </Button>
              <Button onClick={clearFilters} variant="outline" className="rounded-none">
                {t("clearFilters")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

