"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Mail, Clock } from "lucide-react";

export function ContactInfo() {
  const t = useTranslations("contact");

  return (
    <div className="space-y-6">
      {/* Contact Information Card */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl" style={{ fontFamily: '"Castoro Titling", serif' }}>
            {t("contactInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{t("email")}</p>
              <p className="text-sm text-muted-foreground">rollerstat@rollerstat.com</p>
            </div>
          </div>


          {/* Hours */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{t("businessHours")}</p>
              <p className="text-sm text-muted-foreground">
                {t("hoursLine1")}<br />
                {t("hoursLine2")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Card */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl" style={{ fontFamily: '"Castoro Titling", serif' }}>
            {t("followUs")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <a
              href="https://x.com/Rollerstat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
              aria-label="X"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.901 1.153h3.68l-8.04 9.19 9.459 12.504H16.6l-5.796-7.574-6.63 7.574H.5l8.6-9.83L0 1.153h7.588l5.243 6.932 6.07-6.932Zm-1.29 19.5h2.04L6.48 3.112H4.29l13.32 17.54Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/rollerstat.ig/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.75 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
              </svg>
            </a>
            <a
              href="https://www.threads.com/@rollerstat.ig"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
              aria-label="Threads"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.3 10.7c-.1-2.7-1.6-4.2-4.3-4.2-2.8 0-4.5 1.7-4.6 4.1h2.2c.1-1.2 1-2 2.4-2 1.3 0 2.1.7 2.2 1.9-3.1.1-6 1-6 3.8 0 2 1.5 3.3 3.8 3.3 1.6 0 2.8-.6 3.5-1.8.5.8 1.3 1.3 2.4 1.3 1.8 0 3-1.2 3-3.1 0-2.2-1.5-3.2-4.6-3.3Zm-2.1 1.7c-.1 1.6-1 2.7-2.4 2.7-1 0-1.7-.5-1.7-1.3 0-1.1 1.2-1.5 4.1-1.6Zm2.2 2.5c-.3 0-.5-.1-.7-.2.1-.4.2-.8.2-1.2 1.3.1 1.9.4 1.9 1 0 .3-.2.4-.5.4Z" />
              </svg>
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {t("socialDescription")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
