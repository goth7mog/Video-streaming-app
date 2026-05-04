variable "digitalocean_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "root_ssh_fingerprint" {
  description = "SSH key fingerprint for DigitalOcean"
  type        = string
  default     = ""
}

variable "ssh_public_key" {
  description = "SSH public key for cloud-init"
  type        = string
  default     = ""
}


variable "main_user_password" {
  description = "Password for the main user"
  type        = string
  sensitive   = true
  default     = ""
}
