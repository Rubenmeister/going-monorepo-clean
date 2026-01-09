resource "google_redis_instance" "cache" {
  name           = "going-redis-${var.environment}"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  
  authorized_network = google_compute_network.vite_vpc.id
  connect_mode       = "DIRECT_PEERING"

  display_name = "Going Superapp Redis Cache"
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "redis_port" {
  value = google_redis_instance.cache.port
}
