package com.clopez.lgram.datamodel;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;

public interface UserRepository extends DatastoreRepository<User, String>{
		List<User> findByName(String name);
		List<User> findByEmail(String email);
		
		@Cacheable(value = "users")
		Optional<User> findById(String id);
		
		@CacheEvict(value = "users", key = "#u.hashCode()")
		<S extends User> S save(S u);
}
