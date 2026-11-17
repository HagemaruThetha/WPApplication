// Shared deck content: used by build-pptx.js and build-html.js so both outputs say the same thing.
// Every figure here comes from README.md and docs/TEST_PLAN.md in this repository.

const meta = {
  title: "School WordPress on AWS",
  subtitle: "Provisioned with Terraform, tested live in ap-southeast-1",
  kicker: "Xtremax · Cloud Engineer Technical Assessment",
  presenter: "Zharif Zhafran",
  role: "Cloud Engineer candidate",
  date: "November 2026",
};

const slides = [
  {
    id: "title",
    notes:
      "Good morning, and thank you for the time. I'm Zharif. I'll walk you through my submission for the Cloud Engineer assessment: a school WordPress site on AWS, provisioned end to end with Terraform. I'll cover the design, security, scaling and how I tested it.",
  },
  {
    id: "summary",
    title: "One terraform apply builds the full WordPress stack",
    rows: [
      {
        icon: "brief",
        head: "The brief",
        body: "WordPress behind CloudFront and an ALB, EC2 Auto Scaling (1 to 4), RDS MySQL, HTTPS end to end, least-privilege network and IAM",
      },
      {
        icon: "build",
        head: "What I built",
        body: "Five reusable Terraform modules covering edge, network, app and data tiers, plus hardening beyond the brief: WAF, KMS, Multi-AZ, flow logs",
      },
      {
        icon: "proof",
        head: "How I tested it",
        body: "Unit tests, two security scanners, and a real deployment in ap-southeast-1 that passed live checks before a clean teardown",
      },
    ],
    stats: [
      { value: "97", label: "AWS resources from one plan" },
      { value: "5", label: "Terraform modules" },
      { value: "173 / 0", label: "Checkov checks passed / failed" },
      { value: "9 / 9", label: "Live endpoint checks passed" },
    ],
    notes:
      "A single terraform apply builds 97 resources from five modules. Every requirement in the brief maps to a specific module, and I added some hardening the brief didn't ask for: WAF, customer-managed KMS keys, Multi-AZ RDS and flow logs. I also deployed it to a real AWS account, ran live checks against it, then destroyed it cleanly.",
  },
  {
    id: "architecture",
    title: "Three tiers, two Availability Zones, one HTTPS path",
    notes:
      "Traffic enters through CloudFront with WAF in front, and is HTTPS from the visitor to CloudFront and from CloudFront to the load balancer. The ALB sits in public subnets but only accepts traffic from CloudFront's managed prefix list, so you can't bypass the CDN. WordPress runs on EC2 in private subnets with no public IPs, sharing uploads on EFS. The database is RDS MySQL, Multi-AZ and encrypted, in its own private subnets with no route to the internet. Credentials live in Secrets Manager; instances fetch them at boot.",
  },
  {
    id: "security",
    title: "Each tier accepts traffic only from the one in front",
    layers: [
      { icon: "edge", head: "Edge", body: "WAFv2 managed rules and rate limiting; CloudFront geo allowlist (ID, SG, MY)" },
      { icon: "lock", head: "Transport", body: "HTTP redirects to HTTPS; HTTPS-only origin; ALB on TLS 1.3 / 1.2 policy" },
      { icon: "network", head: "Network", body: "ALB open only to the CloudFront prefix list; chained security groups; three subnet NACLs" },
      { icon: "key", head: "Identity", body: "EC2 role can read one secret and decrypt its key; no credentials in user data" },
      { icon: "data", head: "Data", body: "Customer-managed KMS keys; encrypted RDS and EFS; flow logs and access logs to private S3" },
    ],
    callout: { value: "0", label: "public IPs on EC2 or RDS", sub: "Direct requests to the ALB from the internet time out by design" },
    notes:
      "Each tier accepts traffic only from the tier in front of it. At the edge there's WAF and a geo allowlist, and both hops use HTTPS. Security groups chain ALB to app to database, with network ACLs as a second, subnet-level control. The instance role is scoped to a single secret. Data at rest is encrypted with customer-managed KMS keys, and flow logs and access logs are kept. No EC2 instance or database is reachable from the internet, and I confirmed that a direct request to the ALB times out.",
  },
  {
    id: "scaling",
    title: "Scales 1 to 4 instances on 30-min CPU averages",
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
      "CloudWatch evaluates average CPU in 5-minute periods, and it takes 6 consecutive periods, so 30 minutes, above 80 percent to add an instance, or below 40 percent to remove one. The group never goes below 1 or above 4. For that to work the instances have to be interchangeable: uploads live on EFS, auth keys and salts are shared through Secrets Manager so sessions survive across nodes, and WordPress is pinned with dashboard edits disabled. In the live test I drove the alarms and watched the group go from 1 to 2 and back to 1.",
  },
  {
    id: "iac",
    title: "Five modules, connected through their outputs",
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
      "The code is split into five modules. Network feeds subnet and security group IDs into database and application. Database hands the endpoint and secret ARN to application. WAF is created in us-east-1, as CloudFront requires, and passed to the CDN module. Providers are pinned with a committed lock file, so the plan is the same on any machine. There's a terraform test suite on mocked providers that asserts the key requirements without touching AWS, and nothing sensitive is in source control.",
  },
  {
    id: "validation",
    title: "Static checks, scanners and a live deployment",
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
          ["TLS certificate", "valid"],
          ["WAF probe", "blocked with 403"],
          ["Direct ALB request", "timed out"],
          ["Scaling path", "1 → 2 → 1 instances"],
        ],
      },
    ],
    footnote: "Stack torn down with terraform destroy on 5 Nov 2026: 97 resources removed, no manual cleanup",
    notes:
      "Static checks: formatting, validation, a plan of 97 resources, and three terraform test runs, all passing. Scanners: Checkov passed 173 checks with zero failures, and Trivy found nothing; the three skips are documented in the code with reasons, such as WordPress not supporting RDS IAM auth. Live: I deployed to Singapore and my verification script passed all nine checks: TLS, the HTTP redirect, every page, and a WAF block. I also forced the scaling alarms and watched the group go from 1 to 2 and back. Then I destroyed the stack so it wouldn't keep costing money.",
  },
  {
    id: "alt",
    title: "Alternative: ECS Fargate with an application pipeline",
    pipelines: [
      {
        name: "Application pipeline",
        when: "runs when a merge to main changes app/ · ships a new WordPress image",
        steps: [
          { head: "Merge changes app/", body: "Dockerfile, theme, plugins" },
          { head: "Build image", body: "WordPress 7.1.4 baked in" },
          { head: "Trivy scan", body: "Stops on High or Critical" },
          { head: "Push to ECR", body: "Tagged with commit SHA" },
          { head: "Deploy to ECS", body: "Rolling, auto rollback" },
        ],
      },
    ],
    footnote: "Proposal, not built. Dark tile is the only runtime change; everything else stays as deployed",
    notes:
      "This is the design I'd move to next; I haven't built it. The edge, load balancer, database, EFS and Secrets Manager stay as they are. The EC2 Auto Scaling group becomes an ECS service on Fargate, and releases go through a GitHub Actions pipeline. It runs when a merge to main changes the app folder: it builds the WordPress image, scans it with Trivy and stops on anything High or Critical, pushes it to ECR tagged with the commit, then registers a new task definition and rolls the ECS service forward. It logs in to AWS through an OIDC role, so no long-lived keys sit in GitHub. If new tasks fail health checks, the deployment circuit breaker rolls back. Content edits in WordPress admin still go straight to the database and need neither pipeline.",
  },
  {
    id: "tradeoff",
    title: "EC2 Auto Scaling or ECS Fargate",
    head: ["", "EC2 Auto Scaling (built)", "ECS Fargate (proposed)"],
    rows: [
      ["Fit with the brief", "The brief asks for EC2 in an Auto Scaling group", "A change from the brief that would need agreement first"],
      ["Patching", "Patch the OS by updating the AMI and refreshing instances", "No hosts to patch; AWS maintains the Fargate platform"],
      ["Releases", "Each instance installs WordPress at boot from a script", "One tested image in ECR, identical on every task"],
      ["App releases", "Change the launch template, then an instance refresh", "Rolling deploy from the app pipeline, automatic rollback"],
      ["Scale-out", "New instances boot and install before serving", "New tasks pull a prebuilt image and start"],
      ["Cost and parts", "Cheaper compute at steady load; fewer moving parts", "Pricier per vCPU; adds ECR, a pipeline and a Dockerfile"],
    ],
    verdict: "I built EC2 because the brief names it. I'd move to ECS Fargate once releases are frequent enough to need a pipeline.",
    notes:
      "Here's how the two compare. EC2 is what the brief asks for, it's cheaper for steady load, and it has fewer moving parts, but I own OS patching and every new instance installs WordPress at boot. Fargate removes host patching, and every task runs the same tested image, which makes deploys and rollbacks routine. The cost is a higher price per vCPU and more to maintain: a Dockerfile, ECR and the pipeline. So I built what the brief specified, and this is the path I'd recommend once the site is changing often.",
  },
  {
    id: "close",
    title: "Summary",
    takeaways: [
      { head: "Repeatable", body: "One apply from five modules with pinned provider versions" },
      { head: "Private by default", body: "No public IPs on EC2 or RDS; HTTPS on both hops; one-secret IAM role" },
      { head: "Tested", body: "Unit tests, two scanners and a live deployment, then a clean teardown" },
    ],
    notes:
      "So: one apply builds it from pinned, modular code; nothing behind the load balancer is reachable from the internet; and it was tested with unit tests, two scanners and a real deployment. Thank you. I can take questions or open any part of the code.",
  },
];

module.exports = { meta, slides };
