package com.clopez.lgram.datamodel;

import java.util.List;

import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;

public interface UserRepository extends DatastoreRepository<User, String>{
		List<User> findByName(String name);
		List<User> findByEmail(String email);
}
