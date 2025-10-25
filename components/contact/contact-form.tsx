"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useTranslations } from "next-intl";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl" style={{ fontFamily: '"Castoro Titling", serif' }}>
          {t("formTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                {t("name")} *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-none mt-1"
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                {t("email")} *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-none mt-1"
                placeholder={t("emailPlaceholder")}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              {t("message")} *
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="rounded-none mt-1 resize-none"
              placeholder={t("messagePlaceholder")}
            />
          </div>

          {submitStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              {t("successMessage")}
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {t("errorMessage")}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-none bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t("sending")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                {t("sendMessage")}
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
