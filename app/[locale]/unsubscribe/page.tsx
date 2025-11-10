'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getLocaleFromPathname } from '@/lib/i18n';


export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = useTranslations('unsubscribe');
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState('');
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  
  const unsubscribeReasons = [
    t('reasons.tooManyEmails'),
    t('reasons.contentNotRelevant'),
    t('reasons.neverSignedUp'),
    t('reasons.technicalIssues'),
    t('reasons.other')
  ];

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Decode URL-encoded token
        const decodedToken = decodeURIComponent(token);
        
        // Call API to verify token on server side
        const response = await fetch('/api/verify-unsubscribe-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: decodedToken }),
        });

        const result = await response.json();
        
        if (result.valid && result.email) {
          setIsValidToken(true);
          setEmail(result.email);
        } else {
          setIsValidToken(false);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleReasonChange = (reason: string, checked: boolean) => {
    if (checked) {
      setSelectedReasons([...selectedReasons, reason]);
    } else {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) {
      toast.error(t('errors.emailNotFound'));
      return;
    }

    setIsUnsubscribing(true);
    
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          locale: locale, // Pass the locale from the URL
          reasons: selectedReasons,
          customReason: customReason.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsUnsubscribed(true);
        toast.success(t('success.unsubscribed'));
      } else {
        toast.error(data.error || t('errors.failedToUnsubscribe'));
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error(t('errors.failedToUnsubscribeLater'));
    } finally {
      setIsUnsubscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">{t('invalidToken.title')}</CardTitle>
            <CardDescription>
              {t('invalidToken.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = `/${locale}`}
              className="w-full"
            >
              {t('goToHomepage')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isUnsubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">{t('success.title')}</CardTitle>
            <CardDescription>
              {t('success.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {t('success.message')}
            </p>
            <Button 
              onClick={() => window.location.href = `/${locale}`}
              className="w-full"
            >
              {t('goToHomepage')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">{t('emailLabel')}: {email}</Label>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">
              {t('reasons.title')}
            </Label>
            <div className="space-y-2">
              {unsubscribeReasons.map((reason, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason)}
                    onChange={(e) => handleReasonChange(reason, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="customReason" className="text-sm font-medium">
              {t('comments.title')}
            </Label>
            <Textarea
              id="customReason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={t('comments.placeholder')}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button
            onClick={handleUnsubscribe}
            disabled={isUnsubscribing}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isUnsubscribing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('unsubscribing')}</span>
              </div>
            ) : (
              t('button')
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
