// Shared deck content: used by build-pptx.js and build-html.js so both outputs say the same thing.
// Every figure here comes from README.md and docs/TEST_PLAN.md in this repository.

const meta = {
  title: "School WordPress on AWS",
  subtitle: "Secure, auto-scaling and fully codified with Terraform",
  kicker: "Xtremax · Cloud Engineer Technical Assessment",
  presenter: "Zharif Zhafran",
  role: "Cloud Engineer candidate",
  date: "November 2026",
};

const slides = [
  {
    id: "title",
    notes:
      "Good morning, and thank you for the time. I'm Zharif. Over the next few minutes I'll walk you through my submission for the Cloud Engineer assessment: a school WordPress site on AWS, provisioned end to end with Terraform. I'll cover what I built, how it's secured and how it scales, and how I proved it works. Then I'm happy to go as deep as you'd like on any part.",
  },
  {
    id: "summary",
    title: "One Terraform apply delivers a production-shaped WordPress platform",
    rows: [
      {
        icon: "brief",
        head: "The brief",
        body: "WordPress behind CloudFront and an ALB, EC2 Auto Scaling (1 to 4), RDS MySQL, HTTPS end to end, least-privilege network and IAM.",
      },
      {
        icon: "build",
        head: "What I built",
        body: "Five reusable Terraform modules covering edge, network, app and data tiers, plus hardening beyond the brief: WAF, KMS, Multi-AZ, flow logs.",
      },
      {
        icon: "proof",
        head: "How it is proven",
        body: "Unit tests, two security scanners, and a real deployment in ap-southeast-1 that passed live checks before a clean teardown.",
      },
    ],
    stats: [
      { value: "97", label: "AWS resources from one plan" },
      { value: "5", label: "Terraform modules" },
      { value: "173 / 0", label: "Checkov checks passed / failed" },
      { value: "9 / 9", label: "Live endpoint checks passed" },
    ],
    notes:
      "The headline: a single terraform apply builds the whole platform, 97 resources, from five modules. Every requirement in the brief maps to a specific module, and I went further on hardening where it was cheap to do so: WAF, customer-managed KMS keys, Multi-AZ RDS and flow logs. And it isn't just theory. I deployed it to a real AWS account, ran live checks against it, then destroyed it cleanly.",
  },
  {
    id: "architecture",
    title: "Three tiers, two Availability Zones, one HTTPS path",
    notes:
      "Traffic enters through CloudFront with WAF in front, and is HTTPS from the visitor to CloudFront and from CloudFront to the load balancer. The ALB sits in public subnets but only accepts traffic from CloudFront's managed prefix list, so you can't bypass the CDN. WordPress runs on EC2 in private subnets with no public IPs, sharing uploads on EFS. The database is RDS MySQL, Multi-AZ and encrypted, in its own private subnets with no route to the internet. Credentials live in Secrets Manager; instances fetch them at boot.",
  },
  {
    id: "security",
    title: "Every tier only trusts the tier in front of it",
    layers: [
      { icon: "edge", head: "Edge", body: "WAFv2 managed rules and rate limiting; CloudFront geo allowlist (ID, SG, MY)" },
      { icon: "lock", head: "Transport", body: "HTTP redirects to HTTPS; HTTPS-only origin; ALB on TLS 1.3 / 1.2 policy" },
      { icon: "network", head: "Network", body: "ALB open only to the CloudFront prefix list; chained security groups; three subnet NACLs" },
      { icon: "key", head: "Identity", body: "EC2 role can read one secret and decrypt its key. No credentials in user data" },
      { icon: "data", head: "Data", body: "Customer-managed KMS keys; encrypted RDS and EFS; flow logs and access logs to private S3" },
    ],
    callout: { value: "0", label: "public IPs on EC2 or RDS", sub: "Direct requests to the ALB from the internet time out by design" },
    notes:
      "Security is layered so each tier only accepts traffic from the one in front of it. WAF and geo restrictions at the edge. HTTPS on both hops. Security groups chain ALB to app to database, with network ACLs as a second, subnet-level control. The instance role is scoped to a single secret. Everything at rest is encrypted with customer-managed keys, and network and access logs are captured. The result: no EC2 instance or database is reachable from the internet, and I confirmed that a direct request to the ALB times out.",
  },
  {
    id: "scaling",
    title: "Capacity follows demand, within firm guard-rails",
    bands: [
      { range: "< 40% · −1", label: "Scale in", tone: "in" },
      { range: "40% to 80%", label: "Hold steady", tone: "hold" },
      { range: "> 80% · +1", label: "Scale out", tone: "out" },
    ],
    resilience: [
      { icon: "db", head: "Multi-AZ RDS", body: "Standby in a second AZ with automated backups" },
      { icon: "files", head: "Shared uploads on EFS", body: "Every instance sees the same media library" },
      { icon: "users", head: "Shared sessions", body: "One set of auth keys in Secrets Manager keeps logins valid across nodes" },
      { icon: "pin", head: "Identical instances", body: "WordPress 7.1.4 pinned; dashboard edits disabled to stop drift" },
    ],
    notes:
      "Scaling follows the brief exactly: CloudWatch evaluates average CPU in 5-minute periods, and it takes 6 consecutive periods, so 30 minutes, above 80 percent to add an instance, or below 40 percent to remove one. The group never goes below 1 or above 4. Scaling only works if instances are interchangeable, so uploads live on EFS, auth keys and salts are shared through Secrets Manager so sessions survive across nodes, and WordPress is pinned with dashboard edits disabled. In the live test I drove the alarms and watched the group go from 1 to 2 and back to 1.",
  },
  {
    id: "iac",
    title: "Five modules, wired by outputs, pinned for repeatability",
    modules: [
      { id: "network", body: "VPC, 6 subnets, NAT per AZ, NACLs, security groups, flow logs" },
      { id: "database", body: "RDS MySQL, KMS key, Secrets Manager, monitoring role" },
      { id: "application", body: "ALB, launch template, ASG, alarms, EFS, IAM" },
      { id: "waf", body: "Web ACL in us-east-1" },
      { id: "cdn", body: "CloudFront distribution and log bucket" },
    ],
    practices: [
      "AWS provider 6.62.0 and random 3.9.1 pinned, lock file committed",
      "terraform test with mocked providers: no AWS account needed",
      "Secrets and state kept out of Git; placeholder tfvars example",
    ],
    notes:
      "The code is split into five modules with clear boundaries. Network feeds subnet and security group IDs into database and application. Database hands the endpoint and secret ARN to application. WAF is created in us-east-1, as CloudFront requires, and passed to the CDN module. Providers are pinned with a committed lock file, so anyone gets the same plan. There's a terraform test suite on mocked providers that asserts the key requirements without touching AWS, and nothing sensitive is in source control.",
  },
  {
    id: "validation",
    title: "Validated at three levels: static, scanned and live",
    columns: [
      {
        icon: "code",
        head: "Static",
        items: [
          ["fmt + validate", "pass"],
          ["plan", "97 add · 0 change · 0 destroy"],
          ["terraform test", "3 / 3 passed"],
        ],
      },
      {
        icon: "shield",
        head: "Scanned",
        items: [
          ["Checkov", "173 passed · 0 failed"],
          ["Trivy", "0 findings"],
          ["Skips", "3, each justified inline"],
        ],
      },
      {
        icon: "cloud",
        head: "Live in ap-southeast-1",
        items: [
          ["verify-live.sh", "9 / 9 passed"],
          ["HTTP → HTTPS", "301 redirect"],
          ["WAF probe", "blocked with 403"],
          ["Scaling path", "1 → 2 → 1 instances"],
        ],
      },
    ],
    footnote: "Stack torn down with terraform destroy on 5 Nov 2026: 97 resources removed, no manual cleanup.",
    notes:
      "I tested at three levels. Static: formatting, validation, a clean plan of 97 resources, and three unit test runs that pass. Scanned: Checkov passed 173 checks with zero failures, and Trivy found nothing; the three skips are documented in the code with reasons, such as WordPress not supporting RDS IAM auth. Live: I deployed to Singapore, and my verification script passed all nine checks, covering TLS, redirects, every page, and a WAF block. I also exercised the scaling path. Then I destroyed the stack so it wouldn't keep costing money.",
  },
  {
    id: "close",
    title: "Repeatable. Secure by default. Proven.",
    takeaways: [
      { head: "Repeatable", body: "One apply, pinned versions, modular code anyone can rerun" },
      { head: "Secure by default", body: "No public compute or data, HTTPS everywhere, least privilege" },
      { head: "Proven", body: "Tested, scanned and verified live before a clean teardown" },
    ],
    notes:
      "To sum up: the platform is repeatable, because it's one apply from pinned, modular code; secure by default, with nothing public behind the load balancer and least privilege throughout; and proven, through tests, scans and a real deployment. Thank you. I'm happy to take questions or walk through any of the code.",
  },
];

module.exports = { meta, slides };
