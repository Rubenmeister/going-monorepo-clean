variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The default GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "The password for the Cloud SQL database user"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
  default     = "prod"
}

variable "jwt_secret" {
  description = "JWT secret for authentication tokens"
  type        = string
  sensitive   = true
}

variable "kushki_public_key" {
  description = "Kushki payment gateway public key"
  type        = string
  sensitive   = true
}

variable "kushki_private_merchant_id" {
  description = "Kushki payment gateway private merchant id"
  type        = string
  sensitive   = true
}

variable "twilio_account_sid" {
  description = "Twilio Account SID for SMS/OTP"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token for SMS/OTP"
  type        = string
  sensitive   = true
}

variable "twilio_from_number" {
  description = "Twilio Phone Number for SMS/OTP"
  type        = string
}

variable "resend_api_key" {
  description = "Resend API key for emails"
  type        = string
  sensitive   = true
}

variable "meta_wa_access_token" {
  description = "Meta WhatsApp Access Token"
  type        = string
  sensitive   = true
}

variable "meta_wa_phone_number_id" {
  description = "Meta WhatsApp Phone Number ID"
  type        = string
}

variable "firebase_project_id" {
  description = "Firebase project ID for push notifications"
  type        = string
}
