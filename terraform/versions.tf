terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 6.62.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "= 3.9.1"
    }
  }
}
