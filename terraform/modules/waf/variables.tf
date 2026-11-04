variable "name_prefix" {
  description = "Prefix used to name the web ACL."
  type        = string
}

variable "tags" {
  description = "Tags applied to the web ACL."
  type        = map(string)
  default     = {}
}
